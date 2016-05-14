#!/usr/bin/env node

var path = require('path');
var contentDisposition = require('content-disposition');
var pkg = require(path.join(__dirname, '../package.json'));
var prompt = require('prompt');

var buildFruits = require('./build');
var initFruits = require('./init');


// Parse command line options

var program = require('commander');

program
    .version(pkg.version)
    .option('-s, --suffix <suffix>', 'Which files should be used for schema (defaults to .db.yml)')
    .option('-l, --language <language>', 'What programming language do you want to target')
    .option('-t, --template <template>', 'What template do you want to run')
    .parse(process.argv);

if (process.argv.length > 0) {
    var subModule = process.argv.length > 1 ? process.argv[2] : '';
    
    if (subModule && !subModule.match(/-.*/)) {
        if (subModule == 'initTest'){
            initFruits('test_db','test_schema', 'test_role_name', 'test_author');
        }
        if (subModule == 'buildTest'){
            buildFruits('.', '.db.yml', 'ALL', 'All');
        }
        if (subModule == 'build'){
            var suffix = program.suffix || '.db.yml';
            var language = program.language || 'ALL';
            var template = program.template || 'ALL';
            
            buildFruits('.', suffix, language, template);
            console.log('Starting creating models');
        }
        if (subModule == 'init') {
            console.log('Create boiler plate for liquibase|fruit')
            prompt.start();

            var schema = {
                properties: {
                    dbName: {
                        description: 'db name',
                        pattern: /^[a-z]+[a-z_]*$/,
                        message: 'Db name must be lower case letters only contains but cannot start with underscores',
                        required: true
                    },
                    schema: {
                        description: 'schema name',
                        pattern: /^[a-z]+$/,
                        message: 'Schema must be lower case letters only',
                        required: true
                    },
                    serviceUser: {
                        description: 'service user role',
                        pattern: /^[a-z]+[a-z_]*$/,
                        message: 'User role must be lower case letters only contains but cannot start with underscores',
                        required: true
                    },
                    author: {
                        description: 'author (You)',
                        pattern: /^[a-z]+[a-z_]{2,5}$/,
                        message: 'Author must be lower case letters only contains but cannot start with underscores limited to 6 characters',
                        required: true
                    }
                }
            };

            prompt.get(schema, function (err, result) {
                if (err) {
                    return onErr(err);
                }
                console.log('Schema: ' + result.schema);
                console.log('Service User Role: ' + result.serviceUser);
                prompt.stop();
                initFruits(result.dbName, result.schema, result.serviceUser, result.author);
            });

            function onErr(err) {
                console.log(err);
                return 1;
            }
        }
    } else {
        console.log('please specify build or init');
    }
}