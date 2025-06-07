{
  function generateError(message, location) {
    const { start, end } = location;
    const errorMessage = `${message}\n` +
      `at line ${start.line}, column ${start.column} to line ${end.line}, column ${end.column}`;
    throw new Error(errorMessage);
  }

  /*——— Custom error handler for syntax errors ———*/
  function parseError(error) {
    // error.expected : array of { type, description }
    // error.found    : string | null
    // error.location : { start, end }
    const { expected, found, location } = error;

    // Group expected items by description to avoid duplicates
    const uniqueExpected = [...new Set(expected.map(e => e.description))];
    
    // Format the expected values in a more readable way
    const expectedDesc = uniqueExpected
      .map(desc => `'${desc}'`)
      .join(' or ');

    const foundDesc = found === null ? 'end of input' : `'${found}'`;

    generateError(
      `Syntax error: expected ${expectedDesc} but found ${foundDesc}`,
      location
    );
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

element "component or control structure"
  = forLoop
  / ifCondition
  / svgElement
  / selfClosingElement
  / openCloseElement
  / openUnclosedTag
  / comment

selfClosingElement "self-closing component tag"
  = _ "<" _ tagName:tagName _ attributes:attributes _ "/>" _ {
      const attrsString = formatAttributes(attributes);
      return attrsString ? `h(${tagName}, ${attrsString})` : `h(${tagName})`;
    }

openCloseElement "component with content"
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ content:content _ "</" _ closingTagName:tagName _ ">" _ {
      if (tagName !== closingTagName) {
        generateError(
          `Mismatched tag: opened <${tagName}> but closed </${closingTagName}>`,
          location()
        );
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

attributes "component attributes"
  = attrs:(attribute (_ attribute)*)? {
      return attrs
        ? [attrs[0]].concat(attrs[1].map(a => a[1]))
        : [];
    }

attribute "attribute"
  = staticAttribute
  / dynamicAttribute
  / eventHandler
  / spreadAttribute
  / unclosedQuote
  / unclosedBrace

spreadAttribute "spread attribute"
  = "..." expr:(functionCallExpr / dotNotation) {
      return "..." + expr;
    }

functionCallExpr "function call"
  = name:dotNotation "(" args:functionArgs? ")" {
      return `${name}(${args || ''})`;
    }

dotNotation "property access"
  = first:identifier rest:("." identifier)* {
      return text();
    }

eventHandler "event handler"
  = "@" eventName:identifier _ "=" _ "{" _ handlerName:attributeValue _ "}" {
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(eventName);
      const formattedName = needsQuotes ? `'${eventName}'` : eventName;
      return `${formattedName}: ${handlerName}`;
    }
     / "@" eventName:attributeName _ {
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(eventName);
      return needsQuotes ? `'${eventName}'` : eventName;
    }

dynamicAttribute "dynamic attribute"
  = attributeName:attributeName _ "=" _ "{" _ attributeValue:attributeValue _ "}" {
      // Check if attributeName needs to be quoted (contains dash or other invalid JS identifier chars)
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(attributeName);
      const formattedName = needsQuotes ? `'${attributeName}'` : attributeName;
      
      // If it's a complex object literal starting with curly braces, preserve it as is
      if (attributeValue.trim().startsWith('{') && attributeValue.trim().endsWith('}')) {
        return `${formattedName}: ${attributeValue}`;
      }
      
      // Handle other types of values
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

attributeValue "attribute value"
  = element
  / functionWithElement
  / objectLiteral
  / $([^{}]* ("{" [^{}]* "}" [^{}]*)*) {
    const t = text().trim()
    if (t.startsWith("{") && t.endsWith("}")) {
      return `(${t})`;
    }
    return t
  }

objectLiteral "object literal"
  = "{" _ objContent:objectContent _ "}" {
    return `{ ${objContent} }`;
  }

objectContent
  = prop:objectProperty rest:(_ "," _ objectProperty)* {
    return [prop].concat(rest.map(r => r[3])).join(', ');
  }
  / "" { return ""; }

objectProperty
  = key:identifier _ ":" _ value:propertyValue {
    return `${key}: ${value}`;
  }
  / key:identifier {
    return key;
  }

propertyValue
  = nestedObject
  / element
  / functionWithElement
  / stringLiteral
  / identifier

nestedObject
  = "{" _ objContent:objectContent _ "}" {
    return `{ ${objContent} }`;
  }

stringLiteral
  = '"' chars:[^"]* '"' { return text(); }
  / "'" chars:[^']* "'" { return text(); }

functionWithElement "function expression"
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

staticAttribute "static attribute"
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

content "component content"
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

forLoop "for loop"
  = _ "@for" _ "(" _ variableName:(tupleDestructuring / identifier) _ "of" _ iterable:iterable _ ")" _ "{" _ content:content _ "}" _ {
      return `loop(${iterable}, ${variableName} => ${content})`;
    }

tupleDestructuring "destructuring pattern"
  = "(" _ first:identifier _ "," _ second:identifier _ ")" {
      return `(${first}, ${second})`;
    }

ifCondition "if condition"
  = _ "@if" _ "(" _ condition:condition _ ")" _ "{" _ content:content _ "}" _ {
      return `cond(${condition}, () => ${content})`;
    }

tagName "tag name"
  = tagExpression

tagExpression "tag expression"
  = first:tagPart rest:("." tagPart)* {
      return text();
    }

tagPart "tag part"
  = name:[a-zA-Z][a-zA-Z0-9]* args:("(" functionArgs? ")")? {
      return text();
    }

attributeName "attribute name"
  = [a-zA-Z][a-zA-Z0-9-]* { return text(); }

eventName
  = [a-zA-Z][a-zA-Z0-9-]* { return text(); }

variableName
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

iterable "iterable expression"
  = id:identifier "(" _ args:functionArgs? _ ")" { // Direct function call
      return `${id}(${args || ''})`;
    }
  / first:identifier "." rest:dotFunctionChain { // Dot notation possibly with function call
      return `${first}.${rest}`;
    }
  / id:identifier { return id; }

dotFunctionChain
  = segment:identifier "(" _ args:functionArgs? _ ")" rest:("." dotFunctionChain)? {
      const restStr = rest ? `.${rest[1]}` : '';
      return `${segment}(${args || ''})${restStr}`;
    }
  / segment:identifier rest:("." dotFunctionChain)? {
      const restStr = rest ? `.${rest[1]}` : '';
      return `${segment}${restStr}`;
    }

condition "condition expression"
  = functionCall
  / text_condition:$([^)]*) {
      const originalText = text_condition.trim();

      // Transform simple identifiers to function calls like "foo" to "foo()"
      // This regex matches identifiers not followed by an opening parenthesis.
      // This transformation should only apply if we are wrapping in 'computed'.
      if (originalText.includes('!') || originalText.includes('&&') || originalText.includes('||')) {
          const transformedText = originalText.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\()/g, (match) => {
              // Do not transform keywords (true, false, null) or numeric literals
              if (['true', 'false', 'null'].includes(match) || /^\d+(\.\d+)?$/.test(match)) {
                  return match;
              }
              return `${match}()`;
          });
          return `computed(() => ${transformedText})`;
      }
      // For simple conditions (no !, &&, ||), return the original text as is.
      // Cases like `myFunction()` are handled by the `functionCall` rule.
      return originalText;
  }

functionCall "function call"
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

// Add a special error detection rule for unclosed tags
openUnclosedTag "unclosed tag"
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ content:content _ !("</" _ closingTagName:tagName _ ">") {
      generateError(
        `Unclosed tag: <${tagName}> is missing its closing tag`,
        location()
      );
    }

// Add error detection for unclosed quotes in static attributes
unclosedQuote "unclosed string"
  = attributeName:attributeName _ "=" _ "\"" [^"]* !("\"") {
      generateError(
        `Missing closing quote in attribute '${attributeName}'`,
        location()
      );
    }

// Add error detection for unclosed braces in dynamic attributes
unclosedBrace "unclosed brace"
  = attributeName:attributeName _ "=" _ "{" !("}" / _ "}") [^{}]* {
      generateError(
        `Missing closing brace in dynamic attribute '${attributeName}'`,
        location()
      );
    }

svgElement "SVG element"
  = "<svg" attrs:([^>]*) ">" content:svgInnerContent "</svg>" _ {
      const attributes = attrs.join('').trim();
      // Clean up the content by removing extra whitespace and newlines
      const cleanContent = content.replace(/\s+/g, ' ').trim();
      const rawContent = `<svg${attributes ? ' ' + attributes : ''}>${cleanContent}</svg>`;
      return `h(Svg, { content: \`${rawContent}\` })`;
    }

svgInnerContent "SVG inner content"
  = content:$((!("</svg>") .)*) {
      return content;
    }