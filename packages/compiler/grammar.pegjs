start
  = element

tagName
  = [a-zA-Z]+ { return text(); }

element
  = "<" tagName:tagName _ attributes:attributes ">" _ content:content "</" tagName ">" {
    console.log(attributes)
    return `h('${tagName}', {
        ${attributes && attributes.join(',\n')}
        children: [
            ${content}
        ]
    })`;
  }

attributes
  = attribute:attribute* { return attribute }

attribute
  = "[" attributeName:attributeName "]" "=" "\"" attributeValue:attributeValue "\"" { 
    return `${attributeName}: [(${attributeValue}), [${attributeValue.match(/\b[a-zA-Z]+\b/g)}]]`; 
  }
  / "(" eventName ")" "=" "\"" eventAction "\"" { return `${eventName}: () => { ${eventAction} }`; }

content
  = _ val:(textElement / forLoop / ifCondition / element)* _ { return val; }

textElement
  = "{{" variableName "}}" { return `h('Text', { children: [${variableName}] })`; }

forLoop
  = "@for" _ "(" _ "let" _ variableName:variableName  _ "of" _ iterable:iterable _ ")" _ "{" content:content "}" {
    return `loop(${iterable}, (${variableName}) => { ${content} })`;
  }

ifCondition
  = "@if" _ "("  _ condition:condition  _ ")" _ "{" content:content "}" {
    return `cond(${condition}, () => { ${content} })`;
  }

attributeName
  = [a-zA-Z]+ { return text(); }

eventName
  = [a-zA-Z]+ { return text(); }

attributeValue
  = [^"]* { return text(); }

variableName
  = [a-zA-Z]+ { return text(); }

iterable
  = [a-zA-Z]+ { return text(); }

condition
  = [^)]* { return text(); }

eventAction
  = action:javascriptCode { return action; }

javascriptCode
  = [^)]+ { return text(); }

_ 'whitespace'
  = [ \t\n\r]*