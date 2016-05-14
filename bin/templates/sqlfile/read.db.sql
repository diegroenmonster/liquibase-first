SELECT
    {{#foreach properties}}
    {{name}} as {{fmt.name}}{{#unless $last}},{{/unless}}
    {{/foreach}}
FROM {{schema}}.{{name}} 
WHERE @Id IS NULL OR id = @Id;