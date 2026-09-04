#!/bin/sh
# firebase-tools requires JDK 21+. Prefer Homebrew openjdk@21 over the default 17.
set -e

if [ -z "$JAVA_HOME" ] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -q '"21'; then
  if [ -x /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java ]; then
    JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  elif [ -x /usr/libexec/java_home ]; then
    JAVA_HOME="$(/usr/libexec/java_home -v 21)"
  fi
  export JAVA_HOME
fi

export PATH="$JAVA_HOME/bin:$PATH"

exec firebase "$@"
