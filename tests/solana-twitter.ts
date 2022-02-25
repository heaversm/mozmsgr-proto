import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";
import * as assert from "assert";
import * as bs58 from "bs58";

describe("solana-twitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;

  it("can send a new tweet", async () => {
    // Before sending the transaction to the blockchain.
    const tweet = anchor.web3.Keypair.generate(); //generate an account from which to send the tweet
    await program.rpc.sendTweet(
      "solana",
      "How much does each message cost to send?",
      {
        accounts: {
          tweet: tweet.publicKey,
          author: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
      }
    );

    // After sending the transaction to the blockchain.
    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(
      tweetAccount.author.toBase58(),
      program.provider.wallet.publicKey.toBase58() //your wallet address is the base58 format of your public key on Solana - these need to be converted to compare author to wallet
    );
    assert.equal(tweetAccount.topic, "solana");
    assert.equal(
      tweetAccount.content,
      "How much does each message cost to send?"
    );
    assert.ok(tweetAccount.timestamp);
  });

  it("can send a new tweet without a topic", async () => {
    // Before sending the transaction to the blockchain.
    const tweet = anchor.web3.Keypair.generate(); //generate an account from which to send the tweet
    await program.rpc.sendTweet("", "Howdy", {
      accounts: {
        tweet: tweet.publicKey,
        author: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweet],
    });

    // After sending the transaction to the blockchain.
    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(
      tweetAccount.author.toBase58(),
      program.provider.wallet.publicKey.toBase58() //your wallet address is the base58 format of your public key on Solana - these need to be converted to compare author to wallet
    );
    assert.equal(tweetAccount.topic, "");
    assert.equal(tweetAccount.content, "gm");
    assert.ok(tweetAccount.timestamp);
  });

  it("can send a new tweet from a different author", async () => {
    // Generate another user and airdrop them some SOL.
    const otherUser = anchor.web3.Keypair.generate();

    //request airdrop to be able to make the tweet
    const signature = await program.provider.connection.requestAirdrop(
      otherUser.publicKey,
      1000000000
    );

    //await the provider's confirmation of the airdrop
    await program.provider.connection.confirmTransaction(signature);

    // Call the "SendTweet" instruction on behalf of this other user.
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet(
      "decentralization",
      "These messages are not stored on a central server",
      {
        accounts: {
          tweet: tweet.publicKey,
          author: otherUser.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [otherUser, tweet],
      }
    );

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(
      tweetAccount.author.toBase58(),
      otherUser.publicKey.toBase58()
    );
    assert.equal(tweetAccount.topic, "decentralization");
    assert.equal(
      tweetAccount.content,
      "These messages are not stored on a central server"
    );
    assert.ok(tweetAccount.timestamp);
  });

  it("cannot provide a topic with more than 50 characters", async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();
      const topicWith51Chars = "x".repeat(51);
      await program.rpc.sendTweet(topicWith51Chars, "Testing lengthy topic", {
        accounts: {
          tweet: tweet.publicKey,
          author: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
      });
    } catch (error) {
      assert.equal(
        error.msg,
        "The provided topic should be 50 characters long maximum."
      );
      return;
    }

    assert.fail(
      "The instruction should have failed with a 51-character topic."
    );
  });

  it("cannot provide a content with more than 280 characters", async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();
      const contentWith281Chars = "x".repeat(281);
      await program.rpc.sendTweet("web3", contentWith281Chars, {
        accounts: {
          tweet: tweet.publicKey,
          author: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
      });
    } catch (error) {
      assert.equal(
        error.msg,
        "The provided content should be 280 characters long maximum."
      );
      return;
    }

    assert.fail(
      "The instruction should have failed with a 281-character content."
    );
  });

  it("can fetch all tweets", async () => {
    const tweetAccounts = await program.account.tweet.all();
    assert.equal(tweetAccounts.length, 3); //the previous tests create 3 tweets - check to make sure
  });

  it("can filter tweets by author", async () => {
    const authorPublicKey = program.provider.wallet.publicKey;
    const tweetAccounts = await program.account.tweet.all([
      {
        memcmp: {
          offset: 8, // Discriminator takes up first 8 bytes.
          bytes: authorPublicKey.toBase58(), //next 58 bytes are an author's public key
        },
      },
    ]);

    assert.equal(tweetAccounts.length, 2); //only 2 accounts should come back since only 2 are from our wallet
    assert.ok(
      tweetAccounts.every((tweetAccount) => {
        return (
          tweetAccount.account.author.toBase58() === authorPublicKey.toBase58() //make sure that the tweet accounts match our public key just in case
        );
      })
    );
  });

  it("can filter tweets by topics", async () => {
    const tweetAccounts = await program.account.tweet.all([
      {
        memcmp: {
          //find the byte in each tweet at which the topic begins
          offset:
            8 + // Discriminator.
            32 + // Author public key.
            8 + // Timestamp.
            4, // Topic string prefix.
          bytes: bs58.encode(Buffer.from("decentralization")), //search for this topic
        },
      },
    ]);

    assert.equal(tweetAccounts.length, 2);
    assert.ok(
      tweetAccounts.every((tweetAccount) => {
        return tweetAccount.account.topic === "decentralization";
      })
    );
  });
});
