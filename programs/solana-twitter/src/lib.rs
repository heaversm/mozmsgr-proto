use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("2gBxzk957ujqfpBCJ8S9PdJZ3WutME85hjL1cUGrma1d");

#[program]
pub mod solana_twitter {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> ProgramResult { //link function to its context struct
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet; //the & is Rust indicator of a reference
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap(); //need to unwrap this account because `get()` returns the timestamp value inside its result (Ok)

        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into()) //implement our custom error handlers
        }
    
        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into())
        }

        tweet.author = *author.key; //* because we need to dereference the author's public key to associate it with the the tweet
        tweet.timestamp = clock.unix_timestamp;
        tweet.topic = topic;
        tweet.content = content;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendTweet<'info> { //here's my public account - create a Tweet there please
    #[account(init, payer = author, space = Tweet::LEN)] //how much storage and who pays
    pub tweet: Account<'info, Tweet>, 
    #[account(mut)] //author is mutable because we are mutating the money in their account, since they are the payer
    pub author: Signer<'info>,
    #[account(address = system_program::ID)] //if we didn't have this, there's nothing stopping someone from replacing the official Solana program with a malicious one
    pub system_program: AccountInfo<'info>, //need to pass through the official Solana program
}

#[account]
pub struct Tweet { 
    pub author: Pubkey, 
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.

// Add a constant on the Tweet account that provides its total size.
impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // Topic.
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content.
}

//Custom error handlers
#[error]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}