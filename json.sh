#!/bin/bash
# SPDX-License-Identifier: GPL-2.0
#
# Copyright (C) 2015-2019 Jason A. Donenfeld <Jason@zx2c4.com>. All Rights Reserved.
#
# Modified by EchoEkhi to use with automated software in 2020.

exec < <(exec wg show all dump)

printf '{ '
printf '"peers": ['
while read -r -d $'\t' device; do
	if [[ $device != "$last_device" ]]; then
	# filters out server info header
		
		last_device="$device"
		read -r
	else
		read -r public_key preshared_key endpoint allowed_ips latest_handshake transfer_rx transfer_tx persistent_keepalive
		printf '%s\t{\n' "$delim" 
		delim=$'\n'
		{ printf '%s\t\t"publicKey": "%s"' '' "$public_key"; delim=$',\n'; }
		{ printf '%s\t\t"endpoint": "%s"' "$delim" "$endpoint"; delim=$',\n'; }
		{ printf '%s\t\t"latestHandshake": %u' "$delim" $(( $latest_handshake )); delim=$',\n'; }
		{ printf '%s\t\t"upload": %u' "$delim" $(( $transfer_rx )); delim=$',\n'; }
		{ printf '%s\t\t"download": %u' "$delim" $(( $transfer_tx )); delim=$',\n'; }
		printf '%s\t\t"allowedIP": ' "$delim"
		delim=$'\n'
		if [[ $allowed_ips != "(none)" ]]; then
			old_ifs="$IFS"
			IFS=,
			for ip in $allowed_ips; do
				printf '%s\t\t\t"%s"' "$delim" "$ip"
				delim=$',\n'
			done
			IFS="$old_ifs"
			delim=$'\n'
		fi
		
		printf '%s\t\t' "$delim"
		printf '\n\t}'
		delim=$',\n'
	fi


done
printf '%s\n' "$end"
printf ']'
printf '}\n'