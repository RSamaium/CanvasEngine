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

  // List of standard HTML DOM elements
  const domElements = new Set([
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 'samp', 's', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
  ]);

  // Framework components that should NOT be transformed to DOM elements
  const frameworkComponents = new Set([
    'Canvas', 'Container', 'Sprite', 'Text', 'DOMElement', 'Svg'
  ]);

  // DisplayObject special attributes that should not be in attrs
  const displayObjectAttributes = new Set([
    'x', 'y', 'scale', 'anchor', 'skew', 'tint', 'rotation', 'angle', 
    'zIndex', 'roundPixels', 'cursor', 'visible', 'alpha', 'pivot', 'filters', 'maskOf', 
    'blendMode', 'filterArea', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 
    'aspectRatio', 'flexGrow', 'flexShrink', 'flexBasis', 'rowGap', 'columnGap', 
    'positionType', 'top', 'right', 'bottom', 'left', 'objectFit', 'objectPosition', 
    'transformOrigin', 'flexDirection', 'justifyContent', 'alignItems', 'alignContent', 
    'alignSelf', 'margin', 'padding', 'border', 'gap', 'blur', 'shadow'
  ]);

  function isDOMElement(tagName) {
    // Don't transform framework components to DOM elements
    if (frameworkComponents.has(tagName)) {
      return false;
    }
    return domElements.has(tagName.toLowerCase());
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

  function formatDOMElement(tagName, attributes) {
    if (attributes.length === 0) {
      return `h(DOMElement, { element: "${tagName}" })`;
    }

    // Separate DisplayObject attributes from DOM attributes
    const domAttrs = [];
    const displayObjectAttrs = [];

    attributes.forEach(attr => {
      // Handle spread attributes
      if (attr.startsWith('...')) {
        displayObjectAttrs.push(attr);
        return;
      }

      // Extract attribute name
      let attrName;
      if (attr.includes(':')) {
        // Format: "name: value" or "'name': value"
        attrName = attr.split(':')[0].trim().replace(/['"]/g, '');
      } else {
        // Standalone attribute
        attrName = attr.replace(/['"]/g, '');
      }

      // Check if it's a DisplayObject attribute
      if (displayObjectAttributes.has(attrName)) {
        displayObjectAttrs.push(attr);
      } else {
        domAttrs.push(attr);
      }
    });

    // Build the result
    const parts = [`element: "${tagName}"`];
    
    if (domAttrs.length > 0) {
      parts.push(`attrs: { ${domAttrs.join(', ')} }`);
    }
    
    if (displayObjectAttrs.length > 0) {
      parts.push(...displayObjectAttrs);
    }

    return `h(DOMElement, { ${parts.join(', ')} })`;
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
  / domElementWithText
  / selfClosingElement
  / openCloseElement
  / openUnclosedTag
  / comment

selfClosingElement "self-closing component tag"
  = _ "<" _ tagName:tagName _ attributes:attributes _ "/>" _ {
      // Check if it's a DOM element
      if (isDOMElement(tagName)) {
        return formatDOMElement(tagName, attributes);
      }
      // Otherwise, treat as regular component
      const attrsString = formatAttributes(attributes);
      return attrsString ? `h(${tagName}, ${attrsString})` : `h(${tagName})`;
    }

domElementWithText "DOM element with text content"
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ text:simpleTextContent _ "</" _ closingTagName:tagName _ ">" _ {
      if (tagName !== closingTagName) {
        generateError(
          `Mismatched tag: opened <${tagName}> but closed </${closingTagName}>`,
          location()
        );
      }
      
      if (isDOMElement(tagName)) {
        if (attributes.length === 0) {
          return `h(DOMElement, { element: "${tagName}", textContent: ${text} })`;
        }

        // Separate DisplayObject attributes from DOM attributes
        const domAttrs = [];
        const displayObjectAttrs = [];

        attributes.forEach(attr => {
          // Handle spread attributes
          if (attr.startsWith('...')) {
            displayObjectAttrs.push(attr);
            return;
          }

          // Extract attribute name
          let attrName;
          if (attr.includes(':')) {
            // Format: "name: value" or "'name': value"
            attrName = attr.split(':')[0].trim().replace(/['"]/g, '');
          } else {
            // Standalone attribute
            attrName = attr.replace(/['"]/g, '');
          }

          // Check if it's a DisplayObject attribute
          if (displayObjectAttributes.has(attrName)) {
            displayObjectAttrs.push(attr);
          } else {
            domAttrs.push(attr);
          }
        });

        // Build the result
        const parts = [`element: "${tagName}"`];
        
        if (domAttrs.length > 0) {
          parts.push(`attrs: { ${domAttrs.join(', ')} }`);
        }
        
        parts.push(`textContent: ${text}`);
        
        if (displayObjectAttrs.length > 0) {
          parts.push(...displayObjectAttrs);
        }

        return `h(DOMElement, { ${parts.join(', ')} })`;
      }
      
      // If not a DOM element, fall back to regular parsing
      return null;
    }

simpleTextContent "simple text content"
  = parts:(simpleDynamicPart / simpleTextPart)+ {
      const validParts = parts.filter(p => p !== null);
      if (validParts.length === 0) return null;
      if (validParts.length === 1) return validParts[0];
      
      // Multiple parts - need to concatenate
      const hasSignals = validParts.some(part => part && part.includes && part.includes('()'));
      if (hasSignals) {
        return `computed(() => ${validParts.join(' + ')})`;
      }
      return validParts.join(' + ');
    }

simpleTextPart "simple text part"
  = !("@for" / "@if") text:$([^<{@]+) {
      const trimmed = text.trim();
      return trimmed ? `'${trimmed}'` : null;
    }

simpleDynamicPart "simple dynamic part"
  = "{" _ expr:attributeValue _ "}" {
      // Handle dynamic expressions like {item.name} or {@text}
      if (expr.trim().match(/^@?[a-zA-Z_][a-zA-Z0-9_.]*$/)) {
        let foundSignal = false;
        const computedValue = expr.replace(/@?[a-zA-Z_][a-zA-Z0-9_]*(?!:)/g, (match) => {
          if (match.startsWith('@')) {
            return match.substring(1);
          }
          foundSignal = true;
          return `${match}()`;
        });
        if (foundSignal) {
          return `computed(() => ${computedValue})`;
        }
        return computedValue;
      }
      return expr;
    }

openCloseElement "component with content"
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ content:content _ "</" _ closingTagName:tagName _ ">" _ {
      if (tagName !== closingTagName) {
        generateError(
          `Mismatched tag: opened <${tagName}> but closed </${closingTagName}>`,
          location()
        );
      }
      
      // Check if it's a DOM element
      if (isDOMElement(tagName)) {
        const children = content ? content : null;
        
        if (attributes.length === 0) {
          if (children) {
            return `h(DOMElement, { element: "${tagName}" }, ${children})`;
          } else {
            return `h(DOMElement, { element: "${tagName}" })`;
          }
        }

        // Separate DisplayObject attributes from DOM attributes
        const domAttrs = [];
        const displayObjectAttrs = [];

        attributes.forEach(attr => {
          // Handle spread attributes
          if (attr.startsWith('...')) {
            displayObjectAttrs.push(attr);
            return;
          }

          // Extract attribute name
          let attrName;
          if (attr.includes(':')) {
            // Format: "name: value" or "'name': value"
            attrName = attr.split(':')[0].trim().replace(/['"]/g, '');
          } else {
            // Standalone attribute
            attrName = attr.replace(/['"]/g, '');
          }

          // Check if it's a DisplayObject attribute
          if (displayObjectAttributes.has(attrName)) {
            displayObjectAttrs.push(attr);
          } else {
            domAttrs.push(attr);
          }
        });

        // Build the result
        const parts = [`element: "${tagName}"`];
        
        if (domAttrs.length > 0) {
          parts.push(`attrs: { ${domAttrs.join(', ')} }`);
        }
        
        if (displayObjectAttrs.length > 0) {
          parts.push(...displayObjectAttrs);
        }

        if (children) {
          return `h(DOMElement, { ${parts.join(', ')} }, ${children})`;
        } else {
          return `h(DOMElement, { ${parts.join(', ')} })`;
        }
      }
      
      // Otherwise, treat as regular component
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
      
      // If it's a template string, preserve it as is
      if (attributeValue.trim().startsWith('`') && attributeValue.trim().endsWith('`')) {
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
  = _ "@if" _ "(" _ condition:condition _ ")" _ "{" _ content:content _ "}" _ elseIfs:elseIfClause* elseClause:elseClause? _ {
      let result = `cond(${condition}, () => ${content}`;
      
      // Add else if clauses
      elseIfs.forEach(elseIf => {
        result += `, [${elseIf.condition}, () => ${elseIf.content}]`;
      });
      
      // Add else clause if present
      if (elseClause) {
        result += `, () => ${elseClause}`;
      }
      
      result += ')';
      return result;
    }

elseIfClause "else if clause"
  = _ "@else" _ "if" _ "(" _ condition:condition _ ")" _ "{" _ content:content _ "}" _ {
      return { condition, content };
    }

elseClause "else clause"
  = _ "@else" _ "{" _ content:content _ "}" _ {
      return content;
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
      if (originalText.includes('!') || originalText.includes('&&') || originalText.includes('||') || 
          originalText.includes('>=') || originalText.includes('<=') || originalText.includes('===') || 
          originalText.includes('!==') || originalText.includes('==') || originalText.includes('!=') ||
          originalText.includes('>') || originalText.includes('<')) {
          const transformedText = originalText.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\()/g, (match, p1, offset) => {
              // Do not transform keywords (true, false, null) or numeric literals
              if (['true', 'false', 'null'].includes(match) || /^\d+(\.\d+)?$/.test(match)) {
                  return match;
              }
              // Check if the match is inside quotes
              const beforeMatch = originalText.substring(0, offset);
              const afterMatch = originalText.substring(offset + match.length);
              const singleQuotesBefore = (beforeMatch.match(/'/g) || []).length;
              const doubleQuotesBefore = (beforeMatch.match(/"/g) || []).length;
              
              // If we're inside quotes, don't transform
              if (singleQuotesBefore % 2 === 1 || doubleQuotesBefore % 2 === 1) {
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