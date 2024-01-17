FROM mcr.microsoft.com/mssql/server:2022-latest

COPY --chmod=775 ./entrypoint.sh /opt/mssql/bin/

USER root
RUN /opt/mssql/bin/mssql-conf set network.tcpport 1441
USER mssql

ENTRYPOINT ["/opt/mssql/bin/entrypoint.sh"]
