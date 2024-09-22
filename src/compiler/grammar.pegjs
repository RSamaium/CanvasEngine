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
      return `${attributeName}: computed(() => ${attributeValue})`;
    }
  / attributeName:attributeName _ {
      return attributeName;
    }

attributeValue
  = $([^{}]* ("{" [^{}]* "}" [^{}]*)*) {
    const t = text().trim()
    if (t.startsWith("{") && t.endsWith("}")) {
      return `(${t})`;
    }
    return t
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
  = [a-zA-Z][a-zA-Z0-9]* { return text(); }

eventName
  = [a-zA-Z][a-zA-Z0-9]* { return text(); }

variableName
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

iterable
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

condition
  = $([^)]*) { return text().trim(); }

eventAction
  = [^"]* { return text(); }

_ 'whitespace'
  = [ \t\n\r]* 

identifier
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }