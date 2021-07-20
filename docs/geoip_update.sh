#!/bin/bash

### Sample download script for https://mailfud.org/geoip-legacy/
### - Adjust DBDIR and FILES below
### - Adjust XTABLES and XT_GEOIP_BUILD if needed
### - Copy script to /etc/cron.weekly or similar for your OS,
###   note that /etc/cron.* filename MUST NOT HAVE .sh extension,
###   rename to /etc/cron.weekly/geoip_update
### Contact: admin@mailfud.org

# Database directory
DBDIR=/usr/share/GeoIP
# Files to download (.dat.gz suffix not required)
FILES="GeoIP GeoIPv6"
#FILES="GeoIP GeoIPv6 GeoIPCity GeoIPCityv6 GeoIPASNum GeoIPASNumv6"

# If http proxy needed
#https_proxy="http://foo.bar:3128"

# Uncomment XTABLES to enable iptables xt_geoip updating
# Must contain filename for legacy IPv4/IPv6 CSV file (GeoIP-legacy.csv)
# 
# xtables-addons needs to be installed
# (apt-get linux-headers-generic xtables-addons-dkms)
# More info: https://inai.de/projects/xtables-addons/
#
#XTABLES="GeoIP-legacy.csv"
# Standard distribution location for xtables script, change if using custom
#XT_GEOIP_BUILD=/usr/lib/xtables-addons/xt_geoip_build

### v0.23
### - fix xtables 3.8+, requires dbip-country-lite.csv
### v0.22
### - fix xtables stuff
### v0.21
### - added GeoIPCityv6, GeoIPASNumv6, fix https_proxy export

# DB directory
test -w $DBDIR && cd $DBDIR 2>/dev/null || { echo "Invalid directory: $DBDIR"; exit 1; }

# Sleep 0-600 sec if started from cron
if [ ! -t 0 ]; then sleep $((RANDOM/54)); fi

if [ "$XTABLES" != "" ]; then
	FILES="$FILES $XTABLES"
fi

export https_proxy
for f in $FILES; do
	# Make sure .gz is stripped
	f=${f%*.gz}
	# Make sure .dat exists
	if [[ ! "$f" =~ \.csv ]]; then f=${f%*.dat}.dat; fi
	# .gz files are kept on disk to compare timestamps (-N)
	wget -nv -N -T 30 --max-redirect 0 https://mailfud.org/geoip-legacy/$f.gz
	RET=$?
	if [ $RET -ne 0 ]; then
		echo "wget $f.gz failed: $RET" >&2
		continue
	fi
	# Unpack and replace files atomically
	if gzip -dc $f.gz >$f.tmp; then
		if ! diff $f $f.tmp >/dev/null 2>&1; then
			if [ "$f" = "$XTABLES" ]; then XUPD=1; fi
			echo "updating $f"
			chmod 644 $f.tmp
			/bin/mv -f $f.tmp $f
		else
			echo "$f is up to date"
		fi
	else
		echo "gunzip $f failed" >&2
		rm -f $f.gz
	fi
	rm -f $f.tmp
done

if [ "$XTABLES" != "" ]; then
	if [ -z "$XT_GEOIP_BUILD" ]; then
		XT_GEOIP_BUILD=/usr/lib/xtables-addons/xt_geoip_build
	fi
	if [ ! -f "$XT_GEOIP_BUILD" ]; then
		echo "xt_geoip_build not found, xtables-addons-common package not installed?" >&2
		exit 0
	fi
	if [ ! -f "GeoIP-legacy.csv" ]; then
		echo "GeoIP-legacy.csv not found, cannot update xt_geoip" >&2
		exit 0
	fi
	if [ ! -z "$XUPD" -o "$(find /usr/share/xt_geoip -name 'US.*' -mtime -14 2>/dev/null)" = "" ]; then
		mkdir -m 755 /usr/share/xt_geoip 2>/dev/null
		# Convert to dbip-country-lite format if needed (xtables-addons 3.8+)
		if grep dbip-country-lite $XT_GEOIP_BUILD >/dev/null; then
			cat $DBDIR/GeoIP-legacy.csv | tr -d '"' | cut -d, -f1,2,5 >$DBDIR/dbip-country-lite.csv.tmp &&
			/bin/mv -f $DBDIR/dbip-country-lite.csv.tmp $DBDIR/dbip-country-lite.csv
			XCMD="perl $XT_GEOIP_BUILD -D /usr/share/xt_geoip -S $DBDIR"
		else
			XCMD="perl $XT_GEOIP_BUILD -D /usr/share/xt_geoip $DBDIR/GeoIP-legacy.csv"
		fi
		RET=$($XCMD 2>/dev/null | tail -1)
		if [[ "$RET" =~ (Zimbabwe|ZW) ]]; then
			echo "xt_geoip updated"
		else
			echo "something went wrong with xt_geoip update" >&2
			echo "do you have perl module Text::CSV_XS / libtext-csv-xs-perl installed?" >&2
			echo "try running command manually:" >&2
			echo "$XCMD" >&2
		fi
	else
		echo "xt_geoip is up to date"
	fi
fi

