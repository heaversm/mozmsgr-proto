import { computed } from "vue";
import { useAnchorWallet } from "solana-wallets-vue";
import { Connection, PublicKey } from "@solana/web3.js";
import { Provider, Program } from "@project-serum/anchor";
import idl from "../../../target/idl/solana_twitter.json";

const programID = new PublicKey(idl.metadata.address); //get the wallet's public address
let workspace = null;

export const useWorkspace = () => workspace;

export const initWorkspace = () => {
  const wallet = useAnchorWallet();
  const connection = new Connection("http://127.0.0.1:8899"); //hardcode for now
  const provider = computed(() => new Provider(connection, wallet.value)); //provider should change any time wallet is updated, hence computed property
  const program = computed(() => new Program(idl, programID, provider.value));

  workspace = {
    wallet,
    connection,
    provider,
    program,
  };
};
