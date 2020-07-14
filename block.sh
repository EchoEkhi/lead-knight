#!/bin/bash
#
# ./block.sh <client-publickey>

wg set wg0 peer $1 remove

echo -n $1