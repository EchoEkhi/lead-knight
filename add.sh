#!/bin/bash
#
# https://github.com/l-n-s/wireguard-install
#
# Copyright (c) 2018 Viktor Villainov. Released under the MIT License.
# 
# Modified by EchoEkhi to use with automated software in 2020.
#
# ./add.sh <$CLIENT_ADDRESS (allowedIP e.g.: 10.9.0.3>

WG_CONFIG="/etc/wireguard/wg0.conf"

# add a new client
# read server config from the first line of the config file ($WG_CONFIG)
CLIENT_PRIVKEY=$( wg genkey )
CLIENT_PUBKEY=$( echo $CLIENT_PRIVKEY | wg pubkey )
SERVER_PUBKEY=$( head -n1 $WG_CONFIG | awk '{print $2}')

# output data about the new client via JSON
echo '
{
    "publicKey": "'$CLIENT_PUBKEY'",
    "privateKey": "'$CLIENT_PRIVKEY'",
    "allowedIP": "'$1'"
}
'

# apply changes to WireGuard via CLI
wg set wg0 peer "$CLIENT_PUBKEY" allowed-ips "$1/32"

