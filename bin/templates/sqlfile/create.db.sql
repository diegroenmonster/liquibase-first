INSERT INTO {{schema}}.{{name}} 
(
    {{#foreach properties}}
    {{#unless auto}}{{name}}{{#unless $last}},{{/unless}}{{/unless}}
    {{/foreach}}
)
VALUES (
    {{#foreach properties}}
    {{#unless auto}}@{{fmt.name}}{{#ifeq type 'json'}}::json{{/ifeq}}{{#unless $last}},{{/unless}}{{/unless}}
    {{/foreach}}
)
RETURNING id;