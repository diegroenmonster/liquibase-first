@echo off
set dbdir= "c:\database\\{{db_name}}\data"
echo %dbdir%
IF exist %dbdir% ( echo %dbdir% exists ) ELSE ( mkdir %dbdir% && echo %dbdir% created)

set dbdir= "c:\database\\{{db_name}}\stats"
echo %dbdir%
IF exist %dbdir% ( echo %dbdir% exists ) ELSE ( mkdir %dbdir% && echo %dbdir% created)

@echo on

liquibase --defaultsFile="provision.properties" --password="Postgres101" update -Ddba_passwd="{{db_name}}_admin" -DTSlocation="c:\database\\{{db_name}}"
