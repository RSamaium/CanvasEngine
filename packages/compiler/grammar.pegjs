{
  function generateError(message, location) {
    const { start, end } = location;
    const errorMessage = `${message}\n` +
      `at line ${start.line}, column ${start.column} to line ${end.line}, column ${end.column}`;
    throw new Error(errorMessage);
  }

  function formatAttributes(attributes) {
    if (attributes.length === 0) {
      return null;
    }
  
    // Check if there's exactly one attribute and it's a spread attribute
    if (attributes.length === 1 && attributes[0].startsWith('...')) {
      // Return the identifier directly, removing the '...'
      return attributes[0].substring(3);
    }
  
    // Otherwise, format as an object literal
    const formattedAttrs = attributes.map(attr => {
      // If it's a spread attribute, keep it as is
      if (attr.startsWith('...')) {
        return attr;
      }
      // If it's a standalone attribute (doesn't contain ':'), format as shorthand property 'name'
      if (!attr.includes(':')) {
        return attr; // JS object literal shorthand
      }
      // Otherwise (key: value), keep it as is
      return attr;
    });
  
    return `{ ${formattedAttrs.join(', ')} }`;
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
      const attrsString = formatAttributes(attributes);
      return attrsString ? `h(${tagName}, ${attrsString})` : `h(${tagName})`;
    }

openCloseElement
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ content:content _ "</" _ closingTagName:tagName _ ">" _ {
      if (tagName !== closingTagName) {
        error("Mismatched opening and closing tags");
      }
      const attrsString = formatAttributes(attributes);
      const children = content ? content : null;
      if (attrsString && children) {
        return `h(${tagName}, ${attrsString}, ${children})`;
      } else if (attrsString) {
        return `h(${tagName}, ${attrsString})`;
      } else if (children) {
        return `h(${tagName}, null, ${children})`;
      } else {
        return `h(${tagName})`;
      }
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
  / spreadAttribute

spreadAttribute
  = "..." expr:(functionCallExpr / dotNotation) {
      return "..." + expr;
    }

functionCallExpr
  = name:dotNotation "(" args:functionArgs? ")" {
      return `${name}(${args || ''})`;
    }

dotNotation
  = first:identifier rest:("." identifier)* {
      return text();
    }

eventHandler
  = "@" eventName:identifier _ "=" _ "{" _ handlerName:attributeValue _ "}" {
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(eventName);
      const formattedName = needsQuotes ? `'${eventName}'` : eventName;
      return `${formattedName}: ${handlerName}`;
    }
     / "@" eventName:attributeName _ {
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(eventName);
      return needsQuotes ? `'${eventName}'` : eventName;
    }

dynamicAttribute
  = attributeName:attributeName _ "=" _ "{" _ attributeValue:attributeValue _ "}" {
      // Check if attributeName needs to be quoted (contains dash or other invalid JS identifier chars)
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(attributeName);
      const formattedName = needsQuotes ? `'${attributeName}'` : attributeName;
      
      if (attributeValue.startsWith('h(') || attributeValue.includes('=>')) {
        return `${formattedName}: ${attributeValue}`;
      } else if (attributeValue.trim().match(/^[a-zA-Z_]\w*$/)) {
        return `${formattedName}: ${attributeValue}`;
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
          return `${formattedName}: computed(() => ${computedValue})`;
        }
        return `${formattedName}: ${computedValue}`;
      }
    }
  / attributeName:attributeName _ {
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(attributeName);
      return needsQuotes ? `'${attributeName}'` : attributeName;
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
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(attributeName);
      const formattedName = needsQuotes ? `'${attributeName}'` : attributeName;
      return `${formattedName}: ${attributeValue}`;
    }

eventAttribute
  = "(" _ eventName:eventName _ ")" _ "=" _ "\"" eventAction:eventAction "\"" {
      return `${eventName}: () => { ${eventAction} }`;
    }

staticValue
  = [^"]+ {
      var val = text();
      return `'${val}'`
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
  = _ "@for" _ "(" _ variableName:(tupleDestructuring / identifier) _ "of" _ iterable:identifier _ ")" _ "{" _ content:content _ "}" _ {
      return `loop(${iterable}, ${variableName} => ${content})`;
    }

tupleDestructuring
  = "(" _ first:identifier _ "," _ second:identifier _ ")" {
      return `(${first}, ${second})`;
    }

ifCondition
  = _ "@if" _ "(" _ condition:condition _ ")" _ "{" _ content:content _ "}" _ {
      return `cond(${condition}, () => ${content})`;
    }

tagName
  = segments:([a-zA-Z][a-zA-Z0-9]* ("." [a-zA-Z][a-zA-Z0-9]*)*) { 
    return text();
  }

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