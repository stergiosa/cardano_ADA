# cardano_ADA
Testnet cardano Send ADA 

Setup and run local node cardano testnet

./cardano-node/cardano-node run                                  \
   --topology      ./testNet/confTestnet/testnet-topology.json   \
   --config        ./testNet/confTestnet/testnet-config.json     \
   --socket-path   ./testNet/socketTestnet/node.socket           \
   --database-path ./testNet/dbTestnet/                          \
   --host-addr 192.168.2.10                                      \
   --port 1337 
 ----------------------------------
 start RPC  in new terminal 
export CARDANO_NODE_SOCKET_PATH=./testNet/socketTestnet/node.socket
----------------------------------
Print info node
./cardano-node/cardano-cli query tip --testnet-magic 1097911063 

output 

{
    "epoch": 170,
    "hash": "e6b2631e2993666b289888197272808413c1c8f8291c2a482468722c9dd7cd3c",
    "slot": 43297542,
    "block": 3096180,
    "era": "Alonzo",
    "syncProgress": "100.00"
}
----------------------------------

