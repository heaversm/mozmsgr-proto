import { computed } from "vue";
import { useAnchorWallet } from "solana-wallets-vue";
import { Connection, PublicKey } from "@solana/web3.js";
import { Provider, Program } from "@project-serum/anchor";
//import idl from "../../../target/idl/solana_twitter.json"; //this works locally, but we need to copy our idl for devnet to `app/src/` directory. Can run the `anchor run copy-idl` script to do this
import idl from '@/idl/solana_twitter.json'

const clusterUrl = process.env.VUE_APP_CLUSTER_URL; //get the appropriate URL from the relevant .env file
const preflightCommitment = "processed"; //commitment level (so a tweet can be rolled back)
const commitment = "processed";
const programID = new PublicKey(idl.metadata.address); //get the wallet's public address
let workspace = null;

export const useWorkspace = () => workspace;

export const initWorkspace = () => {
  const wallet = useAnchorWallet();

  //const connection = new Connection("http://127.0.0.1:8899", commitment); //TODO: hardcode localhost for now
  const connection = new Connection(clusterUrl, commitment);
  const provider = computed(
    () =>
      new Provider(connection, wallet.value, {
        preflightCommitment,
        commitment,
      })
  ); //provider should change any time wallet is updated, hence computed property
  const program = computed(() => new Program(idl, programID, provider.value));

  workspace = {
    wallet,
    connection,
    provider,
    program,
  };
};
