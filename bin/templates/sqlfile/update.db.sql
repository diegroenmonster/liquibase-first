UPDATE {{schema}}.{{name}} SET
    {{#foreach properties}}
    {{name}} = @{{fmt.name}}{{#ifeq type 'json'}}::json{{/ifeq}}{{#unless $last}},{{/unless}}
    {{/foreach}}
WHERE id = @Id
RETURNING id;