import dayjs from "dayjs";

export class Tweet {
  //abstracts the data received from the API
  constructor(publicKey, accountData) {
    this.publicKey = publicKey;
    this.author = accountData.author;
    this.timestamp = accountData.timestamp.toString();
    this.topic = accountData.topic;
    this.content = accountData.content;
  }

  get key() {
    return this.publicKey.toBase58();
  }

  get author_display() {
    //shorten the public key to first and last 4 digits
    const author = this.author.toBase58();
    return author.slice(0, 4) + ".." + author.slice(-4);
  }

  get created_at() {
    //get localized time
    return dayjs.unix(this.timestamp).format("lll");
  }

  get created_ago() {
    return dayjs.unix(this.timestamp).fromNow();
  }
}
