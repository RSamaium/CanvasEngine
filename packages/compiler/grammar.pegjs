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
    'Canvas', 'Container', 'Sprite', 'Text', 'DOMElement', 'Svg', 'Button'
  ]);

  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
    'param', 'source', 'track', 'wbr'
  ]);

  // DisplayObject special attributes that should not be in attrs
  const displayObjectAttributes = new Set([
    'x', 'y', 'scale', 'anchor', 'skew', 'tint', 'rotation', 'angle', 
    'zIndex', 'roundPixels', 'cursor', 'visible', 'alpha', 'pivot', 'filters', 'maskOf', 
    'blendMode', 'filterArea', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 
    'aspectRatio', 'flexGrow', 'flexShrink', 'flexBasis', 'rowGap', 'columnGap', 
    'positionType', 'top', 'right', 'bottom', 'left', 'objectFit', 'objectPosition', 
    'transformOrigin', 'flexDirection', 'justifyContent', 'alignItems', 'alignContent', 
    'alignSelf', 'margin', 'padding', 'border', 'gap', 'blur', 'shadow', 'outline',
    'clip', 'occlusion'
  ]);

  function isDOMElement(tagName) {
    // Don't transform framework components to DOM elements
    if (frameworkComponents.has(tagName)) {
      return false;
    }
    return domElements.has(tagName.toLowerCase());
  }

  function isVoidElement(tagName) {
    return voidElements.has(tagName.toLowerCase());
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

    const { domAttrs, displayObjectAttrs } = splitAttributes(attributes);

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

  function splitAttributes(attributes) {
    const domAttrs = [];
    const displayObjectAttrs = [];
    const classValues = [];
    let classInsertIndex = null;

    attributes.forEach(attr => {
      // Handle spread attributes
      if (attr.startsWith('...')) {
        displayObjectAttrs.push(attr);
        return;
      }

      // Extract attribute name and value (if present)
      let attrName;
      let attrValue;
      if (attr.includes(':')) {
        const colonIndex = attr.indexOf(':');
        attrName = attr.slice(0, colonIndex).trim().replace(/['"]/g, '');
        attrValue = attr.slice(colonIndex + 1).trim();
      } else {
        // Standalone attribute
        attrName = attr.replace(/['"]/g, '');
      }

      // Check if it's a DisplayObject attribute
      if (displayObjectAttributes.has(attrName)) {
        displayObjectAttrs.push(attr);
        return;
      }

      if (attrName === 'class' && attrValue !== undefined) {
        classValues.push(attrValue);
        if (classInsertIndex === null) {
          classInsertIndex = domAttrs.length;
        }
        return;
      }

      domAttrs.push(attr);
    });

    if (classValues.length > 0) {
      const mergedClass = classValues.length === 1
        ? `class: ${classValues[0]}`
        : `class: [${classValues.join(', ')}]`;
      if (classInsertIndex === null) {
        domAttrs.push(mergedClass);
      } else {
        domAttrs.splice(classInsertIndex, 0, mergedClass);
      }
    }

    return { domAttrs, displayObjectAttrs };
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
  / domElementWithMixedContent
  / selfClosingElement
  / voidElement
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

voidElement "void DOM element tag"
  = _ "<" _ tagName:tagName &{ return isVoidElement(tagName); } _ attributes:attributes _ ">" _ {
      return formatDOMElement(tagName, attributes);
    }

domElementWithText "DOM element with text content"
  = "<" _ tagName:tagName &{ return !isVoidElement(tagName); } _ attributes:attributes _ ">" _ text:simpleTextContent _ "</" _ closingTagName:tagName _ ">" _ {
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

        const { domAttrs, displayObjectAttrs } = splitAttributes(attributes);

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

domElementWithMixedContent "DOM element with mixed content"
  = "<" _ tagName:tagName &{ return isDOMElement(tagName) && !isVoidElement(tagName); } _ attributes:attributes _ ">" _ children:domContent _ "</" _ closingTagName:tagName _ ">" _ {
      if (tagName !== closingTagName) {
        generateError(
          `Mismatched tag: opened <${tagName}> but closed </${closingTagName}>`,
          location()
        );
      }

      const childrenContent = children ? children : null;

      if (attributes.length === 0) {
        if (childrenContent) {
          return `h(DOMElement, { element: "${tagName}" }, ${childrenContent})`;
        } else {
          return `h(DOMElement, { element: "${tagName}" })`;
        }
      }

      const { domAttrs, displayObjectAttrs } = splitAttributes(attributes);

      // Build the result
      const parts = [`element: "${tagName}"`];
      
      if (domAttrs.length > 0) {
        parts.push(`attrs: { ${domAttrs.join(', ')} }`);
      }
      
      if (displayObjectAttrs.length > 0) {
        parts.push(...displayObjectAttrs);
      }

      if (childrenContent) {
        return `h(DOMElement, { ${parts.join(', ')} }, ${childrenContent})`;
      } else {
        return `h(DOMElement, { ${parts.join(', ')} })`;
      }
    }

simpleTextContent "simple text content"
  = parts:(simpleDynamicPart / simpleTextPart)+ {
      const validParts = parts.filter(p => p !== null);
      if (validParts.length === 0) return null;
      if (validParts.length === 1) return validParts[0];
      
      // Multiple parts - need to concatenate
      const normalizedParts = validParts.map(part => {
        if (typeof part === 'string' && part.startsWith('computed(() => ') && part.endsWith(')')) {
          return part.slice('computed(() => '.length, -1);
        }
        return part;
      });
      const hasSignals = normalizedParts.some(part => part && part.includes && part.includes('()'));
      if (hasSignals) {
        return `computed(() => ${normalizedParts.join(' + ')})`;
      }
      return normalizedParts.join(' + ');
    }

simpleTextPart "simple text part"
  = !("@for" / "@if") text:$([^<{@]+) {
      const trimmed = text.trim();
      if (!trimmed) return null;
      const escaped = text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
      return `'${escaped}'`;
    }

simpleDynamicPart "simple dynamic part"
  = "{{" _ expr:attributeValue _ "}}" {
      // Handle double brace expressions like {{ object.x }} or {{ @object.x }} or {{ @object.@x }}
      if (expr.trim().match(/^(@?[a-zA-Z_][a-zA-Z0-9_]*)(\.@?[a-zA-Z_][a-zA-Z0-9_]*)*$/)) {
        let foundSignal = false;
        let hasLiterals = false;
        
        // Split by dots to handle each part separately
        const parts = expr.split('.');
        const allLiterals = parts.every(part => part.trim().startsWith('@'));
        
        let computedValue;
        
        if (allLiterals) {
          // All parts are literals, just remove @ prefixes
          computedValue = parts.map(part => part.replace('@', '')).join('.');
          hasLiterals = true;
        } else {
          // Transform each part individually
          computedValue = parts.map(part => {
            const trimmedPart = part.trim();
            if (trimmedPart.startsWith('@')) {
              hasLiterals = true;
              return trimmedPart.substring(1); // Remove @ prefix for literals
            } else {
              // Don't transform keywords
              if (['true', 'false', 'null'].includes(trimmedPart)) {
                return trimmedPart;
              }
              foundSignal = true;
              return `${trimmedPart}()`;
            }
          }).join('.');
        }
        
        if (foundSignal && !allLiterals) {
          return `computed(() => ${computedValue})`;
        }
        return computedValue;
      }
      return expr;
    }
  / "{" _ expr:attributeValue _ "}" {
      // Handle single brace expressions like {item.name} or {@text}
      if (expr.trim().match(/^(@?[a-zA-Z_][a-zA-Z0-9_]*)(\.@?[a-zA-Z_][a-zA-Z0-9_]*)*$/)) {
        let foundSignal = false;
        const computedValue = expr.replace(/@?([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*:)/g, (match, p1) => {
          if (match.startsWith('@')) {
            return p1;
          }
          foundSignal = true;
          return `${p1}()`;
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

        const { domAttrs, displayObjectAttrs } = splitAttributes(attributes);

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
  / unsupportedEventAttribute
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

unsupportedEventAttribute "unsupported event attribute"
  = "@" eventName:attributeName (_ "=" _ "{" _ attributeValue _ "}")? {
      generateError(
        `@${eventName} is no longer supported. Use ${eventName} or ${eventName}={handler}.`,
        location()
      );
    }

dynamicAttribute "dynamic attribute"
  = attributeName:attributeName _ "=" _ "{" _ attributeValue:attributeValue _ "}" {
      // Check if attributeName needs to be quoted (contains dash or other invalid JS identifier chars)
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(attributeName);
      const formattedName = needsQuotes ? `'${attributeName}'` : attributeName;
      
      
        // If it's a complex object with strings, preserve it as is
        if (attributeValue.trim().startsWith('{') && attributeValue.trim().endsWith('}') && 
            (attributeValue.includes('"') || attributeValue.includes("'"))) {
          return `${formattedName}: ${attributeValue}`;
        }
        
        // If it's a template string, transform expressions inside ${}
      if (attributeValue.trim().startsWith('`') && attributeValue.trim().endsWith('`')) {
        // Transform expressions inside ${} in template strings
        let transformedTemplate = attributeValue;
        
        // Find and replace ${expression} patterns
        let startIndex = 0;
        while (true) {
          const dollarIndex = transformedTemplate.indexOf('${', startIndex);
          if (dollarIndex === -1) break;
          
          const braceIndex = transformedTemplate.indexOf('}', dollarIndex);
          if (braceIndex === -1) break;
          
          const expr = transformedTemplate.substring(dollarIndex + 2, braceIndex);
          const trimmedExpr = expr.trim();
          
          let replacement;
          if (trimmedExpr.startsWith('@')) {
            // Remove @ prefix for literals
            replacement = '${' + trimmedExpr.substring(1) + '}';
          } else if (trimmedExpr.match(/^[a-zA-Z_][a-zA-Z0-9_.]*$/)) {
            // Transform identifiers to signals
            replacement = '${' + trimmedExpr + '()}';
          } else {
            // Keep as is for complex expressions
            replacement = '${' + expr + '}';
          }
          
          transformedTemplate = transformedTemplate.substring(0, dollarIndex) + 
                               replacement + 
                               transformedTemplate.substring(braceIndex + 1);
          
          startIndex = dollarIndex + replacement.length;
        }
        
        return formattedName + ': ' + transformedTemplate;
      }
      
      // Handle other types of values
      if (attributeValue.startsWith('h(') || attributeValue.includes('=>')) {
        return `${formattedName}: ${attributeValue}`;
      } else if (attributeValue.trim().match(/^[a-zA-Z_]\w*$/)) {
        return `${formattedName}: ${attributeValue}`;
      } else {
        // Check if this is an object or array literal
        const isObjectLiteral = attributeValue.trim().startsWith('{ ') && attributeValue.trim().endsWith(' }');
        const isArrayLiteral = attributeValue.trim().startsWith('[') && attributeValue.trim().endsWith(']');
        
        let foundSignal = false;
        let hasLiterals = false;
        let computedValue = attributeValue;
        
        // For simple object and array literals (like {x: x, y: 20} or [x, 20]), 
        // don't use computed() at all and don't transform identifiers
        if ((isObjectLiteral || isArrayLiteral) && !attributeValue.includes('()')) {
          // Don't transform anything, return as is
          foundSignal = false;
          computedValue = attributeValue;
        } else {
          // Apply signal transformation for other values
          computedValue = attributeValue.replace(/@?([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*:)/g, (match, p1, offset) => {
            // Don't transform keywords, numbers, or if we're inside quotes
            if (['true', 'false', 'null'].includes(p1) || /^\d+(\.\d+)?$/.test(p1)) {
              return match;
            }
            
            // Check if we're inside a string literal
            const beforeMatch = attributeValue.substring(0, offset);
            const singleQuotesBefore = (beforeMatch.match(/'/g) || []).length;
            const doubleQuotesBefore = (beforeMatch.match(/"/g) || []).length;
            
            // If we're inside quotes, don't transform
            if (singleQuotesBefore % 2 === 1 || doubleQuotesBefore % 2 === 1) {
              return match;
            }
            
            if (match.startsWith('@')) {
              hasLiterals = true;
              return p1; // Remove @ prefix
            }
            foundSignal = true;
            return `${p1}()`;
          });
          
          // Check if any values already contain signals (ending with ())
          if (attributeValue.includes('()')) {
            foundSignal = true;
          }
        }
        
        if (foundSignal) {
          // For objects, wrap in parentheses
          if (attributeValue.trim().startsWith('{') && attributeValue.trim().endsWith('}')) {
            // Remove spaces for objects in parentheses
            const cleanedObject = computedValue.replace(/{ /g, '{').replace(/ }/g, '}');
            return `${formattedName}: computed(() => (${cleanedObject}))`;
          }
          return `${formattedName}: computed(() => ${computedValue})`;
        }
        
        // If only literals (all @), don't use computed
        if (hasLiterals && !foundSignal) {
          return `${formattedName}: ${computedValue}`;
        }
        
        // For static objects and arrays, return as is without parentheses
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
    return text().trim()
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
  / number
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

domContent "DOM content"
  = elements:(domContentPart)* {
      const filteredElements = elements.filter(el => el !== null);
      if (filteredElements.length === 0) return null;
      if (filteredElements.length === 1) return filteredElements[0];
      return `[${filteredElements.join(', ')}]`;
    }

domContentPart
  = element
  / simpleTextContent



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
  / functionCallWithArgs
  / text_condition:$([^)]*) {
      const originalText = text_condition.trim();

      // Handle expressions with @ literals (like @item.@id)
      // First, process dot notation expressions with @ literals
      let processedText = originalText;
      const dotNotationReplacements = new Map();
      let replacementCounter = 0;
      
      // Process dot notation expressions like @item.@id, @item.id, item.@id
      // Only process expressions that contain at least one @
      processedText = processedText.replace(/(@[a-zA-Z_][a-zA-Z0-9_]*)(\.@?[a-zA-Z_][a-zA-Z0-9_]*)+|([a-zA-Z_][a-zA-Z0-9_]*)(\.@[a-zA-Z_][a-zA-Z0-9_]*)+/g, (match) => {
        // Split by dots to handle each part separately
        const parts = match.split('.');
        const allLiterals = parts.every(part => part.trim().startsWith('@'));
        
        let replacement;
        if (allLiterals) {
          // All parts are literals, just remove @ prefixes (no signal transformation)
          replacement = parts.map(part => part.trim().replace('@', '')).join('.');
        } else {
          // Transform each part individually
          // Note: In conditions with operators, even @ literals in the first part
          // should be transformed to signals for comparison
          replacement = parts.map((part, index) => {
            const trimmedPart = part.trim();
            if (trimmedPart.startsWith('@')) {
              // For the first part in conditions with operators, we still want to transform to signal
              // For later parts, keep as literal
              if (index === 0) {
                // First part: remove @ but will be transformed to signal later
                return trimmedPart.substring(1);
              } else {
                // Later parts: remove @ and keep as literal (no signal)
                return trimmedPart.substring(1);
              }
            } else {
              // Don't transform keywords
              if (['true', 'false', 'null'].includes(trimmedPart)) {
                return trimmedPart;
              }
              // Check if already a function call
              if (trimmedPart.includes('(')) {
                return trimmedPart;
              }
              // Transform to signal
              return `${trimmedPart}()`;
            }
          }).join('.');
        }
        
        // Store replacement and use a temporary marker
        const marker = `__DOT_NOTATION_${replacementCounter++}__`;
        dotNotationReplacements.set(marker, replacement);
        return marker;
      });
      
      // Now handle standalone @ identifiers (not in dot notation)
      processedText = processedText.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\.)/g, (match, p1) => {
        return p1; // Remove @ prefix for standalone literals
      });

      // Transform simple identifiers to function calls like "foo" to "foo()"
      // This regex matches identifiers not followed by an opening parenthesis.
      // This transformation should only apply if we are wrapping in 'computed'.
      if (processedText.includes('!') || processedText.includes('&&') || processedText.includes('||') || 
          processedText.includes('>=') || processedText.includes('<=') || processedText.includes('===') || 
          processedText.includes('!==') || processedText.includes('==') || processedText.includes('!=') ||
          processedText.includes('>') || processedText.includes('<')) {
          // Replace dot notation markers with their processed values BEFORE transforming identifiers
          // This way, expressions like @item.id become item.id() and then item() is transformed
          let textWithReplacements = processedText;
          dotNotationReplacements.forEach((value, marker) => {
            textWithReplacements = textWithReplacements.replace(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          });
          
          const transformedText = textWithReplacements.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\()/g, (match, p1, offset) => {
              // Do not transform keywords (true, false, null) or numeric literals
              if (['true', 'false', 'null'].includes(match) || /^\d+(\.\d+)?$/.test(match)) {
                  return match;
              }
              
              // Check if this is a marker (starts with __DOT_NOTATION_)
              if (match.startsWith('__DOT_NOTATION_')) {
                return match; // Don't transform markers
              }
              
              // Check if the match is inside quotes
              const beforeMatch = processedText.substring(0, offset);
              const afterMatch = processedText.substring(offset + match.length);
              const singleQuotesBefore = (beforeMatch.match(/'/g) || []).length;
              const doubleQuotesBefore = (beforeMatch.match(/"/g) || []).length;
              
              // If we're inside quotes, don't transform
              if (singleQuotesBefore % 2 === 1 || doubleQuotesBefore % 2 === 1) {
                  return match;
              }
              
              // Check if this identifier is part of a dot notation expression
              const charBefore = offset > 0 ? textWithReplacements[offset - 1] : '';
              const charAfter = offset + match.length < textWithReplacements.length ? textWithReplacements[offset + match.length] : '';
              
              // If there's a dot before or after, this is part of dot notation
              if (charBefore === '.' || charAfter === '.') {
                // Check if this dot notation expression was a marker (had @ in original)
                const beforeContext = originalText.substring(Math.max(0, offset - 20), offset);
                const afterContext = originalText.substring(offset, Math.min(originalText.length, offset + match.length + 20));
                const fullContext = beforeContext + afterContext;
                
                // Check if this identifier had @ in the original
                const hadAt = fullContext.includes('@' + match) || fullContext.match(new RegExp('@' + match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b'));
                
                if (hadAt) {
                  // Check if ALL parts of the dot notation had @ (all literals)
                  // Find the full dot notation expression in the original
                  const dotExprMatch = originalText.match(/(@?[a-zA-Z_][a-zA-Z0-9_]*)(\.@?[a-zA-Z_][a-zA-Z0-9_]*)+/);
                  if (dotExprMatch) {
                    const dotExpr = dotExprMatch[0];
                    const allPartsHadAt = dotExpr.split('.').every(part => part.trim().startsWith('@'));
                    if (allPartsHadAt) {
                      // All parts were literals (@item.@id), don't transform
                      return match;
                    }
                  }
                  
                  // Only some parts had @ (@item.id or item.@id)
                  if (charAfter === '.') {
                    // First part: transform to signal even if it had @
                    return `${match}()`;
                  } else if (charBefore === '.') {
                    // Later part: already processed in marker, don't retransform
                    return match;
                  }
                }
                
                // In conditions with operators, transform dot notation expressions to signals
                // (e.g., user.role becomes user().role())
                // This applies to regular dot notation, not markers (which are already processed)
                return `${match}()`;
              }
              
              return `${match}()`;
          });
          
          return `computed(() => ${transformedText})`;
      }
      // For simple conditions (no !, &&, ||), return the processed text as is.
      // Cases like `myFunction()` are handled by the `functionCallWithArgs` rule.
      
      // Replace dot notation markers with their processed values
      let finalText = processedText;
      dotNotationReplacements.forEach((value, marker) => {
        finalText = finalText.replace(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      });
      
      return finalText;
  }

functionCall "function call"
  = name:identifier "(" args:functionArgs? ")" {
    return `${name}(${args || ''})`;
  }

functionCallWithArgs "function call with complex args"
  = name:identifier "(" args:complexFunctionArgs? ")" {
    return `${name}(${args || ''})`;
  }

functionArgs
  = arg:functionArg rest:("," _ functionArg)* {
    return [arg].concat(rest.map(r => r[2])).join(', ');
  }

complexFunctionArgs
  = arg:complexFunctionArg rest:("," _ complexFunctionArg)* {
    return [arg].concat(rest.map(r => r[2])).join(', ');
  }

functionArg
  = _ value:(identifier / number / string) _ {
    return value;
  }

complexFunctionArg "complex function argument"
  = _ value:complexArgExpression _ {
    // Process @ literals and transform identifiers to signals
    // Handle dot notation with @ literals like @item.@id, @item.id, item.@id
    // Similar logic to simpleDynamicPart but for function arguments
    
    let processed = value.trim();
    const original = processed;
    
    // Check if it's a dot notation expression
    if (processed.match(/^(@?[a-zA-Z_][a-zA-Z0-9_]*)(\.@?[a-zA-Z_][a-zA-Z0-9_]*)*$/)) {
      // Split by dots to handle each part separately
      const parts = processed.split('.');
      const allLiterals = parts.every(part => part.trim().startsWith('@'));
      
      let computedValue;
      
      if (allLiterals) {
        // All parts are literals, just remove @ prefixes
        computedValue = parts.map(part => part.trim().replace('@', '')).join('.');
      } else {
        // Transform each part individually
        computedValue = parts.map(part => {
          const trimmedPart = part.trim();
          if (trimmedPart.startsWith('@')) {
            return trimmedPart.substring(1); // Remove @ prefix for literals
          } else {
            // Don't transform keywords
            if (['true', 'false', 'null'].includes(trimmedPart)) {
              return trimmedPart;
            }
            // Check if it's already a function call
            if (trimmedPart.includes('(')) {
              return trimmedPart;
            }
            // Transform to signal
            return `${trimmedPart}()`;
          }
        }).join('.');
      }
      
      return computedValue;
    }
    
    // Handle standalone identifiers (not dot notation)
    // If it starts with @, remove @ prefix (literal)
    if (processed.startsWith('@')) {
      return processed.substring(1);
    }
    
    // Don't transform keywords or numbers
    if (['true', 'false', 'null'].includes(processed) || /^\d+(\.\d+)?$/.test(processed)) {
      return processed;
    }
    
    // Check if it's already a function call
    if (processed.includes('(')) {
      return processed;
    }
    
    // Transform identifier to signal
    return `${processed}()`;
  }

complexArgExpression "complex argument expression"
  = $([^,)]* ("(" [^)]* ")" [^,)]*)*) {
    return text().trim();
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
  = "<" _ tagName:tagName &{ return !isVoidElement(tagName); } _ attributes:attributes _ ">" _ content:content _ !("</" _ closingTagName:tagName _ ">") {
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
