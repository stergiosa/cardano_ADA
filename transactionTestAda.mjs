// Author     : g.stergiosa@gmail.com  
// donations  : ADA: addr1qytd990epc3f2df475jmugcxys92ycd520xp9q85nms2kcl6z79mcesdmhsexl9jm9rnpctu0v7x3ef93uq8aqt5pwmq495ah3
// run as     : ~$ node transactionTestAda.mjs
// https://github.com/stergiosa/cardano_ADA
//   Transcode, merge, update from :
//   https://gist.github.com/dk8996/6dc32b3dd8dab6786e6f15d64a18267e		
//   https://developers.cardano.org/docs/integrate-cardano/listening-for-payments-cli/

// Be extremely careful not to send ADA to a 
// testnet address,  you will lose your assets.

import * as fs from 'fs';
// Please add this dependency using npm install node-cmd
import cmd from 'node-cmd';
import * as readlines_ync from 'readline-sync';

// Path to the cardano-cli binary or use the global one
const CARDANO_CLI_PATH = "/Your-PATH/cardano-cli";
// The `testnet` identifier number
const CARDANO_NETWORK_MAGIC = 1097911063;
// The directory where we store our payment keys
const CARDANO_KEYS_DIR = "/Your-PATH/testNetKeys";

const ONE_M = 1000000

// Read wallet address string value from payment.addr file
const walletAddress = fs.readFileSync(`${CARDANO_KEYS_DIR}/payment.addr`).toString();

//DaedalusVallet.addr or payment2.addr
const toWalletAddress = fs.readFileSync(`${CARDANO_KEYS_DIR}/payment2.addr`).toString();
const skWalletAddress = fs.readFileSync(`${CARDANO_KEYS_DIR}/payment.skey`).toString();

console.log("--------------------------------------------------------------------------------------");
console.log("Send Ada\n  Receiver: " + toWalletAddress.trim());
console.log("--------------------------------------------------------------------------------------");

// Create protocol.json
const protocol = cmd.runSync([
    CARDANO_CLI_PATH,
    "query", "protocol-parameters",
    "--testnet-magic", CARDANO_NETWORK_MAGIC,
    "--out-file", (`${CARDANO_KEYS_DIR}/protocol.json`)
].join(" "));


// We use the node-cmd npm library to execute shell commands and read the output data
const rawUtxoTable = cmd.runSync([
    CARDANO_CLI_PATH,
    "query", "utxo",
    "--testnet-magic", CARDANO_NETWORK_MAGIC,
    "--address", walletAddress
].join(" "));

// Calculate total lovelace of the UTXO(s) inside the wallet address
const utxoTableRows = rawUtxoTable.data.trim().split('\n');

console.log("from: " + walletAddress.trim());
console.log("\nA/A        ", utxoTableRows[0]);
console.log(utxoTableRows[1]);

for(let x = 2; x < utxoTableRows.length; x++) {
    console.log(`${x-1}, `,utxoTableRows[x]);
    }
    
let txhash_num = readlines_ync.question("\n select TxHash 1,2, ...)? \n");

console.log("Selected TxHash:A/A) : ", parseInt(txhash_num), utxoTableRows[parseInt(txhash_num)+1]);

let currenTxhash =  utxoTableRows[parseInt(txhash_num)+1].split(" ").filter(i => i);
console.log("adaAmount",currenTxhash[2], " Lovelace, ", parseInt(currenTxhash[2]/ONE_M)," ADA");

let totalLovelaceRecv = 0;
let isPaymentComplete = false;

for(let x = 2; x < utxoTableRows.length; x++) {
    const cells = utxoTableRows[x].split(" ").filter(i => i);
    totalLovelaceRecv += parseInt(cells[2]);
}

let tx_hash     = currenTxhash[0].trim();
let TxIx        = currenTxhash[1].trim();
let tx_balance  = currenTxhash[2].trim();

console.log("tx_hash    :" , tx_hash)   ; 
console.log("TxIx       :" , TxIx)      ;
console.log("tx_balance :" , tx_balance, " Lovelace");


const outDraft = cmd.runSync([
    CARDANO_CLI_PATH,
    "transaction", "build-raw",
    "--tx-in"    , (`${tx_hash}#${TxIx}`)  ,  
    "--tx-out"   , (`${toWalletAddress.trim()}+"0"`) ,
    "--tx-out"   , (`${walletAddress.trim()}+"0"`)   ,
    "--ttl"      , "0",
    "--fee"      , "0",
    "--out-file" ,  (`${CARDANO_KEYS_DIR}/tx.draft`),
].join(" "));

const fee_text = cmd.runSync([
    CARDANO_CLI_PATH,
    "transaction"     , "calculate-min-fee",
    "--tx-body-file"  ,  (`${CARDANO_KEYS_DIR}/tx.draft`),
    "--tx-in-count"   , "1"      ,
    "--tx-out-count"  , "2"      ,  
    "--witness-count" , "1"      ,
    "--byron-witness-count" , "0",
    "--testnet-magic", CARDANO_NETWORK_MAGIC,
    "--protocol-params-file",  (`${CARDANO_KEYS_DIR}/protocol.json`)
].join(" "));

let fee =  (fee_text.data.substring(0,fee_text.data.length-9 )).trim()  ;
let max_amount = parseInt((tx_balance - fee) / ONE_M);

console.log("Fee will be:", fee_text.data.trim() );
console.log("You can only send max of ", max_amount  , " ADA \n");
console.log("--------------------------------------------------------------------------------------");

let send_amount_ada = readlines_ync.question("Amount to send: ");

let send_amount      = send_amount_ada * ONE_M ;
let change_send_back = tx_balance - fee - send_amount ;
let change_send_back_ada = parseInt(change_send_back/ONE_M); 

console.log("Send amount          : ", send_amount," Lovelace" );
console.log("Change send_back     : ", change_send_back, " Lovelace");
console.log("Change send back ADA : ", change_send_back_ada, " ADA");

const tip_text = cmd.runSync([
    CARDANO_CLI_PATH,
    "query", "tip",
    "--testnet-magic", CARDANO_NETWORK_MAGIC
].join(" "));

let slotNo  =  (JSON.parse(tip_text.data)).slot;
let ttl     = slotNo+200
console.log("\nCurrent Slot: ", slotNo, " Setting ttl to: ", ttl);

console.log("----------------------------------------------");
console.log("Send        : ", send_amount_ada, " ADA");
console.log("From address: ", walletAddress.trim() );
console.log("To address  : ", toWalletAddress.trim());
console.log("----------------------------------------------");

const outDraft2 = cmd.runSync([
    CARDANO_CLI_PATH,
    "transaction", "build-raw",
    "--tx-in"    , (`${tx_hash}#${TxIx}`)  ,  
    "--tx-out"   , (`${toWalletAddress.trim()}+${send_amount}`) ,
    "--tx-out"   , (`${walletAddress.trim()}+${change_send_back}`)   ,
    "--ttl"      , (`${ttl}`) ,
    "--fee"      , (`${fee}`) ,
    "--out-file" ,  (`${CARDANO_KEYS_DIR}/tx.raw`)
].join(" "));

const Txsigned = cmd.runSync([
    CARDANO_CLI_PATH,
    "transaction"        , "sign",
    "--tx-body-file"     ,  (`${CARDANO_KEYS_DIR}/tx.raw`),
    "--signing-key-file" ,  (`${CARDANO_KEYS_DIR}/payment.skey`),
    "--testnet-magic"    ,  CARDANO_NETWORK_MAGIC,
    "--out-file"         ,  (`${CARDANO_KEYS_DIR}/tx.signed`)
].join(" "));

let last_message = readlines_ync.question("\n Last confirm press ctlr+c to cancel Tx)? \n");

const submit = cmd.runSync([
    CARDANO_CLI_PATH,
    "transaction", "submit",
    "--tx-file", (`${CARDANO_KEYS_DIR}/tx.signed`),
    "--testnet-magic", CARDANO_NETWORK_MAGIC
].join(" "));

console.log(submit);
console.log(submit.data);

if (submit.data) {isPaymentComplete = true;}
console.log(`Payment Complete: ${(isPaymentComplete ? "✅" : "❌")}`);
