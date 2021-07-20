#!/usr/bin/env python
'''
Parse fail2ban log for IP addresses
Usage: $ ./parse.py log
'''
import re
import sys
import subprocess
import collections


MAX_OCCURENCES = 5  # IPs are banned after this many occurences in log.
LOG_FILE = './fail2ban.log'

def main(target_file):
    '''
    Parse fail2ban log for IP addresses
    :param: target_file - fail2ban file to search for IPs in.
    '''
    ip_regex = (r'\b(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.'
                r'(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.'
                r'(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.'
                r'(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\b')
    all_matches = []

    # find matches and add them to array all_matches
    with open(target_file) as log:
        for line in log:
            match = re.search(ip_regex, line)
            if match:
                all_matches.append(match.group())

    # get all IPs with matches equal or greater than the amount MAX_OCCURENCES
    sorted_ips = collections.Counter(all_matches)
    banned_ips = [item for item in sorted_ips if sorted_ips[item]>MAX_OCCURENCES]
    for ip in banned_ips:
        print  ip
        subprocess.Popen(["iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"])


if __name__ == '__main__':
    main(LOG_FILE)

