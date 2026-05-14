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

  const eventAttributes = new Set([
    'click', 'tap', 'pointertap', 'pointerdown', 'pointerup', 'pointermove',
    'pointerover', 'pointerout', 'pointerupoutside', 'mousedown', 'mouseup',
    'mousemove', 'mouseover', 'mouseout', 'touchstart', 'touchend', 'touchmove',
    'touchcancel', 'rightclick', 'keydown', 'keyup', 'keypress'
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

  function formatDOMContainerAttributes(attributes) {
    if (attributes.length === 0) {
      return null;
    }

    const propsEntries = [];
    const domAttrs = [];
    const classValues = [];
    let classInsertIndex = null;
    let attrsInsertIndex = null;
    let attrsIndex = null;
    let attrsValue = null;

    attributes.forEach(attr => {
      if (attr.startsWith('...')) {
        propsEntries.push(attr);
        return;
      }

      let attrName;
      let attrValue;
      if (attr.includes(':')) {
        const colonIndex = attr.indexOf(':');
        attrName = attr.slice(0, colonIndex).trim().replace(/['"]/g, '');
        attrValue = attr.slice(colonIndex + 1).trim();
      } else {
        attrName = attr.replace(/['"]/g, '');
      }

      if (attrName === 'class' && attrValue !== undefined) {
        classValues.push(attrValue);
        if (classInsertIndex === null) {
          classInsertIndex = domAttrs.length;
        }
        if (attrsInsertIndex === null) {
          attrsInsertIndex = propsEntries.length;
        }
        return;
      }

      if (attrName === 'style') {
        domAttrs.push(attr);
        if (attrsInsertIndex === null) {
          attrsInsertIndex = propsEntries.length;
        }
        return;
      }

      if (attrName === 'attrs' && attrValue !== undefined) {
        attrsValue = attrValue;
        attrsIndex = propsEntries.length;
        propsEntries.push(null);
        return;
      }

      propsEntries.push(attr);
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

    let attrsEntry = null;
    if (attrsValue && domAttrs.length > 0) {
      attrsEntry = `attrs: { ...${attrsValue}, ${domAttrs.join(', ')} }`;
    } else if (attrsValue) {
      attrsEntry = `attrs: ${attrsValue}`;
    } else if (domAttrs.length > 0) {
      attrsEntry = `attrs: { ${domAttrs.join(', ')} }`;
    }

    if (attrsEntry) {
      if (attrsIndex !== null) {
        propsEntries[attrsIndex] = attrsEntry;
      } else if (attrsInsertIndex !== null) {
        propsEntries.splice(attrsInsertIndex, 0, attrsEntry);
      } else {
        propsEntries.unshift(attrsEntry);
      }
    }

    const filteredEntries = propsEntries.filter(entry => entry !== null);
    if (filteredEntries.length === 0) {
      return null;
    }

    if (filteredEntries.length === 1 && filteredEntries[0].startsWith('...')) {
      return filteredEntries[0].substring(3);
    }

    return `{ ${filteredEntries.join(', ')} }`;
  }

  function hasFunctionCall(value) {
    return /[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(value);
  }

  function hasIdentifier(value) {
    return /[a-zA-Z_]/.test(value);
  }

  function isSimpleAccessor(value) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(value.trim());
  }

  function formatObjectLiteralSpacing(value) {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return value;
    }
    const inner = trimmed.slice(1, -1).trim();
    return `{ ${inner} }`;
  }

  function collectMemberRoots(value) {
    const roots = new Set();
    const memberRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\./g;
    let match;

    while ((match = memberRegex.exec(value)) !== null) {
      roots.add(match[1]);
    }

    return roots;
  }

  function transformBareIdentifiersToSignals(value) {
    const memberRoots = collectMemberRoots(value);

    return value.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, name, offset) => {
      if (['true', 'false', 'null'].includes(name)) {
        return match;
      }

      const beforeMatch = value.substring(0, offset);
      const singleQuotesBefore = (beforeMatch.match(/'/g) || []).length;
      const doubleQuotesBefore = (beforeMatch.match(/"/g) || []).length;
      if (singleQuotesBefore % 2 === 1 || doubleQuotesBefore % 2 === 1) {
        return match;
      }

      const charBefore = offset > 0 ? value[offset - 1] : '';
      const charAfter = offset + match.length < value.length ? value[offset + match.length] : '';

      if (charBefore === '.' || charAfter === '.') {
        return match;
      }

      if (memberRoots.has(name)) {
        return match;
      }

      const afterSlice = value.slice(offset + match.length);
      if (/^\s*\(/.test(afterSlice)) {
        return match;
      }

      return `${name}()`;
    });
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
      if (tagName === 'DOMContainer') {
        const attrsString = formatDOMContainerAttributes(attributes);
        return attrsString ? `h(DOMContainer, ${attrsString})` : `h(DOMContainer)`;
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
      const trimmedExpr = expr.trim();
      if (!trimmedExpr) {
        return trimmedExpr;
      }
      if (hasFunctionCall(trimmedExpr)) {
        return `computed(() => ${trimmedExpr})`;
      }
      return trimmedExpr;
    }
  / "{" _ expr:attributeValue _ "}" {
      const trimmedExpr = expr.trim();
      if (!trimmedExpr) {
        return trimmedExpr;
      }
      if (hasFunctionCall(trimmedExpr)) {
        return `computed(() => ${trimmedExpr})`;
      }
      return trimmedExpr;
    }

openCloseElement "component with content"
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ content:content _ "</" _ closingTagName:tagName _ ">" _ {
      if (tagName !== closingTagName) {
        generateError(
          `Mismatched tag: opened <${tagName}> but closed </${closingTagName}>`,
          location()
        );
      }
      
      const children = content ? content : null;

      // Check if it's a DOM element
      if (isDOMElement(tagName)) {
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
      if (tagName === 'DOMContainer') {
        const attrsString = formatDOMContainerAttributes(attributes);
        if (attrsString && children) {
          return `h(DOMContainer, ${attrsString}, ${children})`;
        } else if (attrsString) {
          return `h(DOMContainer, ${attrsString})`;
        } else if (children) {
          return `h(DOMContainer, null, ${children})`;
        } else {
          return `h(DOMContainer)`;
        }
      }

      const attrsString = formatAttributes(attributes);
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
      
        if (eventAttributes.has(attributeName)) {
          return `${formattedName}: ${attributeValue}`;
        }
      
        // If it's a complex object with strings, preserve it as is
        if (attributeValue.trim().startsWith('{') && attributeValue.trim().endsWith('}') && 
            (attributeValue.includes('"') || attributeValue.includes("'"))) {
          return `${formattedName}: ${attributeValue}`;
        }
        
        // If it's a template string, keep it as-is
      if (attributeValue.trim().startsWith('`') && attributeValue.trim().endsWith('`')) {
        return formattedName + ': ' + attributeValue;
      }
      
      // Handle other types of values
      if (attributeValue.startsWith('h(') || attributeValue.includes('=>')) {
        return `${formattedName}: ${attributeValue}`;
      }

      const trimmedValue = attributeValue.trim();
      if (trimmedValue.match(/^[a-zA-Z_]\w*$/)) {
        return `${formattedName}: ${attributeValue}`;
      }

      if (/^\d+(\.\d+)?$/.test(trimmedValue) || ['true', 'false', 'null'].includes(trimmedValue)) {
        return `${formattedName}: ${attributeValue}`;
      }

      if (isSimpleAccessor(trimmedValue)) {
        return `${formattedName}: ${attributeValue}`;
      }

      const isObjectLiteral = trimmedValue.startsWith('{') && trimmedValue.endsWith('}');
      const isArrayLiteral = trimmedValue.startsWith('[') && trimmedValue.endsWith(']');
      const isTernaryExpression = trimmedValue.includes('?') && trimmedValue.includes(':');
      if (isObjectLiteral) {
        const formattedObject = formatObjectLiteralSpacing(attributeValue);
        if (hasFunctionCall(trimmedValue)) {
          return `${formattedName}: computed(() => (${formattedObject}))`;
        }
        return `${formattedName}: ${formattedObject}`;
      }
      if (isArrayLiteral) {
        if (hasFunctionCall(trimmedValue)) {
          return `${formattedName}: computed(() => ${attributeValue})`;
        }
        return `${formattedName}: ${attributeValue}`;
      }

      if (isTernaryExpression) {
        return `${formattedName}: computed(() => ${attributeValue})`;
      }

      if (hasFunctionCall(trimmedValue)) {
        return `${formattedName}: computed(() => ${attributeValue})`;
      }

      if (!hasIdentifier(trimmedValue)) {
        return `${formattedName}: ${attributeValue}`;
      }

      const computedValue = transformBareIdentifiersToSignals(attributeValue);
      return `${formattedName}: computed(() => ${computedValue})`;
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
  = text:$(conditionChunk*) {
      const originalText = text.trim();
      if (!originalText) {
        return originalText;
      }

      const hasOperator = /[!<>=&|]/.test(originalText);
      if (hasOperator || hasFunctionCall(originalText)) {
        return `computed(() => ${originalText})`;
      }

      return originalText;
  }

conditionChunk
  = "(" conditionChunk* ")"
  / [^()]

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
    return value.trim();
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
