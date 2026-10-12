#!/usr/bin/env python3
"""Double-fork daemonizer — round-14 lesson: direct nohup/setsid launches are
reaped when the tool call ends. Double-fork + setsid detaches for real."""
import os
import sys

if len(sys.argv) < 2:
    print("usage: daemonize.py <command> [args...]")
    sys.exit(1)

pid = os.fork()
if pid > 0:
    # parent exits immediately; keep stdout clean
    sys.exit(0)

# first child: new session, detach from controlling terminal
os.setsid()

pid2 = os.fork()
if pid2 > 0:
    os._exit(0)

# second child: reparented to init, fully detached
os.chdir("/")
os.umask(0)
fd = os.open(os.devnull, os.O_RDWR)
for fdi in (0, 1, 2):
    try:
        os.dup2(fd, fdi)
    except Exception:
        pass
if fd > 2:
    os.close(fd)

os.execvp(sys.argv[1], sys.argv[1:])
