{
  function generateError(message, location) {
    const { start, end } = location;
    const errorMessage = `${message}\n` +
      `at line ${start.line}, column ${start.column} to line ${end.line}, column ${end.column}`;
    throw new Error(errorMessage);
  }
}

start
  = _ elements:(element)* _ {
    if (elements.length === 1) {
      return elements[0];
    }
    return `[${elements.join(',')}]`;
  }

element
  = forLoop
  / ifCondition
  / selfClosingElement
  / openCloseElement
  / comment 

selfClosingElement
  = _ "<" _ tagName:tagName _ attributes:attributes _ "/>" _ {
      const attrs = attributes.length > 0 ? `{ ${attributes.join(', ')} }` : null;
      return attrs ? `h(${tagName}, ${attrs})` : `h(${tagName})`;
    }

openCloseElement
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ content:content _ "</" _ closingTagName:tagName _ ">" {
      if (tagName !== closingTagName) {
        error("Mismatched opening and closing tags");
      }
      const attrs = attributes.length > 0 ? `{ ${attributes.join(', ')} }` : null;
      const children = content ? content : null;
      if (attrs && children) {
        return `h(${tagName}, ${attrs}, ${children})`;
      } else if (attrs) {
        return `h(${tagName}, ${attrs})`;
      } else if (children) {
        return `h(${tagName}, null, ${children})`;
      } else {
        return `h(${tagName})`;
      }
    }

  / "<" _ tagName:tagName _ attributes:attributes _ {
      generateError("Syntaxe d'élément invalide", location());
    }

attributes
  = attrs:(attribute (_ attribute)*)? {
      return attrs
        ? [attrs[0]].concat(attrs[1].map(a => a[1]))
        : [];
    }

attribute
  = staticAttribute
  / dynamicAttribute
  / eventHandler

eventHandler
  = "@" eventName:identifier _ "=" _ "{" _ handlerName:attributeValue _ "}" {
      return `${eventName}: ${handlerName}`;
    }
     / "@" eventName:attributeName _ {
      return eventName;
    }

dynamicAttribute
  = attributeName:attributeName _ "=" _ "{" _ attributeValue:attributeValue _ "}" {
      if (attributeValue.startsWith('h(') || attributeValue.includes('=>')) {
        return `${attributeName}: ${attributeValue}`;
      } else if (attributeValue.trim().match(/^[a-zA-Z_]\w*$/)) {
        return `${attributeName}: ${attributeValue}`;
      } else {
        let foundSignal = false;
        const computedValue = attributeValue.replace(/@?[a-zA-Z_][a-zA-Z0-9_]*(?!:)/g, (match) => {
          if (match.startsWith('@')) {
            return match.substring(1);
          }
          foundSignal = true;
          return `${match}()`;
        });
        if (foundSignal) {
          return `${attributeName}: computed(() => ${computedValue})`;
        }
        return `${attributeName}: ${computedValue}`;
      }
    }
  / attributeName:attributeName _ {
      return attributeName;
    }

attributeValue
  = element
  / functionWithElement
  / $([^{}]* ("{" [^{}]* "}" [^{}]*)*) {
    const t = text().trim()
    if (t.startsWith("{") && t.endsWith("}")) {
      return `(${t})`;
    }
    return t
  }

functionWithElement
  = "(" _ params:functionParams? _ ")" _ "=>" _ elem:element {
      return `${params ? `(${params}) =>` : '() =>'} ${elem}`;
    }

functionParams
  = destructuredParams
  / simpleParams

destructuredParams
  = "{" _ param:identifier rest:(_ "," _ identifier)* _ "}" {
      return `{${[param].concat(rest.map(r => r[3])).join(', ')}}`;
    }

simpleParams
  = param:identifier rest:(_ "," _ identifier)* {
      return [param].concat(rest.map(r => r[3])).join(', ');
    }

staticAttribute
  = attributeName:attributeName _ "=" _ "\"" attributeValue:staticValue "\"" {
      return `${attributeName}: ${attributeValue}`;
    }

eventAttribute
  = "(" _ eventName:eventName _ ")" _ "=" _ "\"" eventAction:eventAction "\"" {
      return `${eventName}: () => { ${eventAction} }`;
    }

staticValue
  = [^"]+ {
      var val = text();
      return isNaN(val) ? `'${val}'` : val;
    }

content
  = elements:(element)* {
      const filteredElements = elements.filter(el => el !== null);
      if (filteredElements.length === 0) return null;
      if (filteredElements.length === 1) return filteredElements[0];
      return `[${filteredElements.join(', ')}]`;
    }

textNode
  = text:$([^<]+) {
      const trimmed = text.trim();
      return trimmed ? `'${trimmed}'` : null;
    }

textElement
  = text:[^<>]+ {
      const trimmed = text.join('').trim();
      return trimmed ? JSON.stringify(trimmed) : null;
    }

forLoop
  = _ "@for" _ "(" _ variableName:identifier _ "of" _ iterable:identifier _ ")" _ "{" _ content:content _ "}" _ {
      return `loop(${iterable}, (${variableName}) => ${content})`;
    }

ifCondition
  = _ "@if" _ "(" _ condition:condition _ ")" _ "{" _ content:content _ "}" _ {
      return `cond(${condition}, () => ${content})`;
    }

tagName
  = [a-zA-Z][a-zA-Z0-9]* { return text(); }

attributeName
  = [a-zA-Z][a-zA-Z0-9-]* { return text(); }

eventName
  = [a-zA-Z][a-zA-Z0-9-]* { return text(); }

variableName
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

iterable
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

condition
  = functionCall
  / $([^)]*) { return text().trim(); }

functionCall
  = name:identifier "(" args:functionArgs? ")" {
    return `${name}(${args || ''})`;
  }

functionArgs
  = arg:functionArg rest:("," _ functionArg)* {
    return [arg].concat(rest.map(r => r[2])).join(', ');
  }

functionArg
  = _ value:(identifier / number / string) _ {
    return value;
  }

number
  = [0-9]+ ("." [0-9]+)? { return text(); }

string
  = '"' chars:[^"]* '"' { return text(); }
  / "'" chars:[^']* "'" { return text(); }

eventAction
  = [^"]* { return text(); }

_ 'whitespace'
  = [ \t\n\r]* 

identifier
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

comment
  = singleComment+ {
    return null
  }

singleComment
  = "<!--" _ content:((!("-->") .)* "-->") _ {
      return null;
    }