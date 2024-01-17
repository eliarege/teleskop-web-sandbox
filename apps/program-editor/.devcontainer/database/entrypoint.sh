#!/bin/bash

set -e

# Do initial checks from original image
/opt/mssql/bin/permissions_check.sh true

if [[ -z $MSSQL_DATABASE ]]; then
  MSSQL_DATABASE=Teleskop
fi

# Start SQL Server
/opt/mssql/bin/sqlservr &

# Wait for SQL Server to be ready
for i in {1..50}; do
  /opt/mssql-tools/bin/sqlcmd -S localhost,1441 -U sa -P $MSSQL_SA_PASSWORD -d master \
    -Q "CREATE DATABASE [$MSSQL_DATABASE]" && true

  if [ $? -gt 0 ]; then
    echo "Waiting for SQL Server to be ready"
    sleep 1
  else
    echo "SQL server setup complete"
    break
  fi
done

# Prevent container from stopping
sleep infinity
