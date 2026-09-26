// CanvasEngine template grammar.
//
// This grammar only reads the template: it returns a tree of plain nodes
// (Root, Element, Text, If, For, Svg, attributes...) with their source
// locations, described in src/types.ts. JavaScript code is generated from that
// tree by src/codegen.ts. Actions here must not generate code; they only throw
// syntax errors, which need the parse position.
{
  function generateError(code, message, location, hint) {
    const templateError = new Error(message);
    templateError.name = 'CanvasEngineTemplateError';
    templateError.code = code;
    templateError.location = location;
    templateError.hint = hint;
    throw templateError;
  }

  // List of standard HTML DOM elements
  const domElements = new Set([
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 'samp', 's', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
  ]);

  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
    'param', 'source', 'track', 'wbr'
  ]);

  // A PascalCase tag is always a component (<Video>, <Header>, <Map>), like in
  // JSX and Vue. An HTML tag is written in lowercase, or in uppercase (<DIV>).
  function hasHtmlCase(tagName) {
    return tagName === tagName.toLowerCase() || tagName === tagName.toUpperCase();
  }

  function isDOMElement(tagName) {
    return hasHtmlCase(tagName) && domElements.has(tagName.toLowerCase());
  }

  function isVoidElement(tagName) {
    return hasHtmlCase(tagName) && voidElements.has(tagName.toLowerCase());
  }

  function tagNamesMatch(openingTag, closingTag) {
    return isDOMElement(openingTag)
      ? openingTag.toLowerCase() === closingTag.toLowerCase()
      : openingTag === closingTag;
  }

  function isCompleteForHeader(header) {
    return /^\s*\(\s*(?:\([^)]+\)|[a-zA-Z_][a-zA-Z0-9_]*)\s+of\s+.+(?:;\s*track\s+.+)?\)\s*$/s.test(header);
  }

  function isCompleteIfHeader(header) {
    return /^\s*\(\s*.+\s*\)\s*$/s.test(header);
  }
}

start
  = _ elements:(element)* _ {
    return { type: 'Root', children: elements };
  }

element "component or control structure"
  = unsupportedFragment
  / orphanElseDirective
  / forLoop
  / invalidForDirective
  / ifCondition
  / invalidIfDirective
  / svgElement
  / domElementWithText
  / domElementWithMixedContent
  / componentWithText
  / selfClosingElement
  / voidElement
  / openCloseElement
  / invalidAttributeQuoteElement
  / invalidAttributeExpressionElement
  / invalidSpreadElement
  / unquotedAttributeElement
  / openUnclosedTag
  / comment

selfClosingElement "self-closing component tag"
  = _ "<" _ tagName:tagName _ attributes:attributes _ "/>" _ {
      return { type: 'Element', form: 'selfClosing', tag: tagName, dom: isDOMElement(tagName), attributes, location: location() };
    }

voidElement "void DOM element tag"
  = _ "<" _ tagName:tagName &{ return isVoidElement(tagName); } _ attributes:attributes _ ">" _ {
      return { type: 'Element', form: 'void', tag: tagName, dom: true, attributes, location: location() };
    }

domElementWithText "DOM element with text content"
  = "<" _ tagName:tagName &{ return isDOMElement(tagName) && !isVoidElement(tagName); } _ attributes:attributes _ ">" _ text:simpleTextContent _ "</" _ closingTag:locatedTagName _ ">" _ {
      if (!tagNamesMatch(tagName, closingTag.name)) {
        generateError(
          'CE_TEMPLATE_MISMATCHED_TAG',
          `Mismatched tag: opened <${tagName}> but closed </${closingTag.name}>.`,
          closingTag.location,
          `Replace </${closingTag.name}> with </${tagName}>.`
        );
      }

      return { type: 'Element', form: 'text', tag: tagName, dom: true, attributes, text, location: location() };
    }

domElementWithMixedContent "DOM element with mixed content"
  = "<" _ tagName:tagName &{ return isDOMElement(tagName) && !isVoidElement(tagName); } _ attributes:attributes _ ">" _ children:domContent _ "</" _ closingTag:locatedTagName _ ">" _ {
      if (!tagNamesMatch(tagName, closingTag.name)) {
        generateError(
          'CE_TEMPLATE_MISMATCHED_TAG',
          `Mismatched tag: opened <${tagName}> but closed </${closingTag.name}>.`,
          closingTag.location,
          `Replace </${closingTag.name}> with </${tagName}>.`
        );
      }

      return { type: 'Element', form: 'content', tag: tagName, dom: true, attributes, children, location: location() };
    }

componentWithText "component with text content"
  = "<" _ tagName:tagName &{ return !isDOMElement(tagName) && !isVoidElement(tagName); } _ attributes:attributes _ ">" _ text:simpleTextContent _ "</" _ closingTag:locatedTagName _ ">" _ {
      if (!tagNamesMatch(tagName, closingTag.name)) {
        generateError(
          'CE_TEMPLATE_MISMATCHED_TAG',
          `Mismatched tag: opened <${tagName}> but closed </${closingTag.name}>.`,
          closingTag.location,
          `Replace </${closingTag.name}> with </${tagName}>.`
        );
      }

      return { type: 'Element', form: 'text', tag: tagName, dom: false, attributes, text, location: location() };
    }

simpleTextContent "simple text content"
  = parts:(simpleDynamicPart / simpleTextPart)+ {
      return { type: 'Text', parts, location: location() };
    }

simpleTextPart "simple text part"
  = text:$((!("<" / "{" / directiveStart) .)+) {
      return { type: 'TextPart', value: text };
    }

simpleDynamicPart "simple dynamic part"
  = "{{" _ expr:attributeValue _ "}}" {
      return { type: 'Interpolation', value: expr, location: location() };
    }
  / "{" !([ \t\n\r]* "/*") _ expr:attributeValue _ "}" {
      return { type: 'Interpolation', value: expr, location: location() };
    }

openCloseElement "component with content"
  = "<" _ tagName:tagName _ attributes:attributes _ ">" _ content:content _ "</" _ closingTag:locatedTagName _ ">" _ {
      if (!tagNamesMatch(tagName, closingTag.name)) {
        generateError(
          'CE_TEMPLATE_MISMATCHED_TAG',
          `Mismatched tag: opened <${tagName}> but closed </${closingTag.name}>.`,
          closingTag.location,
          `Replace </${closingTag.name}> with </${tagName}>.`
        );
      }

      return { type: 'Element', form: 'content', tag: tagName, dom: isDOMElement(tagName), attributes, children: content, location: location() };
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
  / unsupportedBindingAttribute
  / jsxSpreadAttribute
  / spreadAttribute
  / unclosedQuote
  / unclosedBrace
  / invalidSpreadAttribute
  / unquotedAttribute

jsxSpreadAttribute "JSX-style spread attribute"
  = "{" _ "..." _ expression:attributeExpression _ "}" {
      return { type: 'SpreadAttribute', code: expression.trim(), validate: true, location: location() };
    }

spreadAttribute "spread attribute"
  = "..." expr:(functionCallExpr / dotNotation) {
      return { type: 'SpreadAttribute', code: expr, validate: false, location: location() };
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
        'CE_TEMPLATE_UNSUPPORTED_EVENT_PREFIX',
        `@${eventName} is no longer supported. Use ${eventName} or ${eventName}={handler}.`,
        location(),
        `Remove the @ prefix from '${eventName}'.`
      );
    }

unsupportedBindingAttribute "unsupported Vue-style binding"
  = ":" attributeName:attributeName {
      generateError(
        'CE_TEMPLATE_UNSUPPORTED_BINDING_PREFIX',
        `Vue-style ':${attributeName}' binding is not supported.`,
        location(),
        `Use ${attributeName}={label} for a JavaScript binding.`
      );
    }

dynamicAttribute "dynamic attribute"
  = attributeName:attributeName _ "=" _ "{" _ attributeValue:attributeValue _ "}" {
      return { type: 'DynamicAttribute', name: attributeName, value: attributeValue, location: location() };
    }
  / attributeName:attributeName _ {
      return { type: 'ShorthandAttribute', name: attributeName, location: location() };
    }

attributeValue "attribute value"
  = element
  / functionWithElement
  / objectLiteral
  / expression:attributeExpression {
    return { type: 'Expression', code: expression.trim() };
  }

attributeExpression "JavaScript attribute expression"
  = $((quotedString / templateString / balancedParentheses / balancedBrackets / balancedBraces / attributeExpressionCharacter)+)

attributeExpressionCharacter
  = ![{}()[\]"'`] .

propertyExpression "JavaScript object property expression"
  = $((quotedString / templateString / balancedParentheses / balancedBrackets / balancedBraces / propertyExpressionCharacter)+) {
    return text().trim()
  }

propertyExpressionCharacter
  = ![,{}()[\]"'`] .

quotedString
  = singleQuotedString
  / doubleQuotedString

singleQuotedString
  = "'" ("\\" . / !"'" .)* "'"

doubleQuotedString
  = '"' ("\\" . / !'"' .)* '"'

templateString
  = "`" ("\\" . / "${" expressionPart* "}" / !"`" .)* "`"

balancedParentheses
  = "(" expressionPart* ")"

balancedBrackets
  = "[" expressionPart* "]"

balancedBraces
  = "{" expressionPart* "}"

expressionPart
  = quotedString
  / templateString
  / balancedParentheses
  / balancedBrackets
  / balancedBraces
  / ![{}()[\]"'`] .

objectLiteral "object literal"
  = "{" _ properties:objectContent _ "}" {
    return { type: 'ObjectLiteral', properties };
  }

objectContent
  = prop:objectProperty rest:(_ "," _ objectProperty)* {
    return [prop].concat(rest.map(r => r[3]));
  }
  / "" { return []; }

objectProperty
  = key:identifier _ ":" _ value:propertyValue {
    return { key, value };
  }
  / key:identifier {
    return { key, value: null };
  }

propertyValue
  = nestedObject
  / element
  / functionWithElement
  / code:stringLiteral { return { type: 'Expression', code }; }
  / code:number { return { type: 'Expression', code }; }
  / value:propertyExpression { return { type: 'Expression', code: value.trim() }; }

nestedObject
  = "{" _ properties:objectContent _ "}" {
    return { type: 'ObjectLiteral', properties };
  }

stringLiteral
  = '"' chars:[^"]* '"' { return text(); }
  / "'" chars:[^']* "'" { return text(); }

functionWithElement "function expression"
  = "(" _ params:functionParams? _ ")" _ "=>" _ elem:element {
      return { type: 'ArrowElement', params: params || null, body: elem };
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
  = attributeName:attributeName _ "=" _ attributeValue:(doubleQuotedStaticValue / singleQuotedStaticValue) {
      return { type: 'StaticAttribute', name: attributeName, value: attributeValue, location: location() };
    }

doubleQuotedStaticValue
  = "\"" chars:[^\"]* "\"" {
      return chars.join('');
    }

singleQuotedStaticValue
  = "'" chars:[^']* "'" {
      return chars.join('');
    }


content "component content"
  = elements:(element)* {
      return elements;
    }

domContent "DOM content"
  = elements:(domContentPart)* {
      return elements;
    }

domContentPart
  = element
  / simpleTextContent


forLoop "for loop"
  = _ forLocation:forToken _ "(" _ variableName:(tupleDestructuring / identifier) _ "of" _ iterable:iterable _ track:forTrack? ")" _ "{" _ content:content _ "}" _ {
      return { type: 'For', binding: variableName, iterable, track: track || null, children: content, location: forLocation };
    }

forToken
  = "@for" { return location(); }

invalidForDirective "invalid @for directive"
  = _ forLocation:forToken header:$((!"{" .)*) "{" &{ return !isCompleteForHeader(header); } {
      generateError(
        'CE_TEMPLATE_INVALID_FOR',
        'Invalid @for directive.',
        forLocation,
        'Expected "@for (item of items) { ... }".'
      );
    }

forTrack "for track expression"
  = _ ";" _ "track" [ \t\n\r]+ expression:trackExpression _ {
      return expression;
    }

trackExpression "track expression"
  = text:$(directiveExpressionPart*) {
      return text.trim();
    }

tupleDestructuring "destructuring pattern"
  = "(" _ first:identifier _ "," _ second:identifier _ ")" {
      return `(${first}, ${second})`;
    }

ifCondition "if condition"
  = _ ifLocation:ifToken _ "(" _ condition:condition _ ")" _ "{" _ content:content _ "}" elseIfs:elseIfClause* elseClause:elseClause? _ {
      if (!condition.trim()) {
        generateError(
          'CE_TEMPLATE_INVALID_IF',
          'Invalid @if directive.',
          ifLocation,
          'Expected "@if (condition) { ... }" with a non-empty condition.'
        );
      }
      return {
        type: 'If',
        condition,
        children: content,
        elseIfs,
        else: elseClause,
        location: ifLocation,
      };
    }

ifToken
  = "@if" { return location(); }

invalidIfDirective "invalid @if directive"
  = _ ifLocation:ifToken header:$((!"{" .)*) "{" &{ return !isCompleteIfHeader(header); } {
      generateError(
        'CE_TEMPLATE_INVALID_IF',
        'Invalid @if directive.',
        ifLocation,
        'Expected "@if (condition) { ... }" with a non-empty condition.'
      );
    }

elseIfClause "else if clause"
  = branchTrivia "@else" _ "if" _ "(" _ condition:condition _ ")" _ "{" _ content:content _ "}" _ {
      return { condition, children: content };
    }

elseClause "else clause"
  = branchTrivia "@else" _ "{" _ content:content _ "}" _ {
      return content;
    }

branchTrivia
  = (_ comment)* _

directiveStart
  = "@if" [ \t\n\r]* "("
  / "@for" [ \t\n\r]* "("
  / "@else" ([ \t\n\r]+ "if" / [ \t\n\r]* "{")

tagName "tag name"
  = tagExpression

locatedTagName
  = name:tagName { return { name, location: location() }; }

tagExpression "tag expression"
  = first:tagPart rest:("." tagPart)* {
      return text();
    }

tagPart "tag part"
  = name:[a-zA-Z][a-zA-Z0-9]* args:("(" functionArgs? ")")? {
      return text();
    }

attributeName "attribute name"
  = [a-zA-Z_$][a-zA-Z0-9_$:-]* { return text(); }


iterable "iterable expression"
  = expression:$(directiveExpressionPart+) { return expression.trim(); }


condition "condition expression"
  = text:$(directiveExpressionPart*) {
      return text.trim();
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


_ 'whitespace'
  = [ \t\n\r]* 

identifier
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

comment
  = (singleComment / jsxComment)+ {
    return { type: 'Comment' };
  }

singleComment
  = "<!--" _ content:((!("-->") .)* "-->") _ {
      return null;
    }

jsxComment
  = "{" _ "/*" (!"*/" .)* "*/" _ "}" _ {
      return null;
    }

unsupportedFragment "unsupported JSX fragment"
  = _ "<>" {
      generateError(
        'CE_TEMPLATE_UNSUPPORTED_FRAGMENT',
        'JSX fragments are not supported.',
        location(),
        'Use sibling root elements directly or wrap them in <Container>.'
      );
    }

orphanElseDirective "orphan @else directive"
  = _ "@else" {
      generateError(
        'CE_TEMPLATE_ORPHAN_ELSE',
        '@else has no matching @if.',
        location(),
        'Place @else immediately after an @if or @else if block.'
      );
    }

invalidSpreadAttribute "invalid spread attribute"
  = "..." expression:$((!([ \t\n\r] / "/>" / ">") .)+) {
      const trimmedExpression = expression.trim();
      generateError(
        'CE_TEMPLATE_INVALID_SPREAD',
        'Invalid spread attribute.',
        location(),
        `Wrap the spread expression in braces: {...${trimmedExpression}}.`
      );
    }

unquotedAttribute "unquoted attribute"
  = attributeName:attributeName _ "=" _ ![\"'{] value:$((!([ \t\n\r] / "/>" / ">") .)+) {
      generateError(
        'CE_TEMPLATE_UNQUOTED_ATTRIBUTE',
        `Attribute '${attributeName}' must be quoted or bound.`,
        location(),
        `Use ${attributeName}=\"${value}\" for text or ${attributeName}={${value}} for a JavaScript value.`
      );
    }

directiveExpressionPart
  = quotedString
  / templateString
  / balancedParentheses
  / balancedBrackets
  / balancedBraces
  / ![;)] .

// Add a special error detection rule for unclosed tags
openUnclosedTag "unclosed tag"
  = "<" _ openingTag:locatedTagName &{ return !isVoidElement(openingTag.name); } _ attributes:attributes _ ">" _ content:content _ !("</" _ closingTagName:tagName _ ">") {
      generateError(
        'CE_TEMPLATE_UNCLOSED_TAG',
        `Unclosed tag <${openingTag.name}>.`,
        openingTag.location,
        `Add the missing </${openingTag.name}> closing tag.`
      );
    }

// Add error detection for unclosed quotes in static attributes
unclosedQuote "unclosed string"
  = match:unclosedQuoteMatch {
      generateError(
        'CE_TEMPLATE_UNCLOSED_QUOTE',
        `Unclosed quoted value for attribute '${match.attributeName}'.`,
        match.location,
        'Add the missing closing quote before the end of the attribute.'
      );
    }

unclosedQuoteMatch
  = attributeName:attributeName _ "=" _ "\"" ((!('"' / '/>') .)*) &('/>') {
      return { attributeName, location: location() };
    }

invalidAttributeQuoteElement "element with an unclosed quoted attribute"
  = _ "<" _ tagName _ ((!unclosedQuoteMatch !('/>') .)*) unclosedQuote

// Add error detection for unclosed braces in dynamic attributes
unclosedBrace "unclosed brace"
  = match:unclosedBraceMatch {
      generateError(
        'CE_TEMPLATE_UNCLOSED_EXPRESSION',
        `Unclosed expression for attribute '${match.attributeName}'.`,
        match.location,
        'Add the missing closing brace before the end of the attribute.'
      );
    }

unclosedBraceMatch
  = attributeName:attributeName _ "=" _ "{" ((!('/>' / '}') .)*) &('/>') {
      return { attributeName, location: location() };
    }

invalidAttributeExpressionElement "element with an unclosed attribute expression"
  = _ "<" _ tagName _ ((!unclosedBraceMatch !('/>') .)*) unclosedBrace

invalidSpreadElement "element with an invalid spread attribute"
  = _ "<" _ tagName _ ((!invalidSpreadAttribute !('/>') .)*) invalidSpreadAttribute

unquotedAttributeElement "element with an unquoted attribute"
  = _ "<" _ tagName _ ((!unquotedAttribute !('/>') .)*) unquotedAttribute

svgElement "SVG element"
  = "<svg" attrs:([^>]*) ">" content:svgInnerContent "</svg>" _ {
      return { type: 'Svg', attributes: attrs.join('').trim(), content, location: location() };
    }

svgInnerContent "SVG inner content"
  = content:$((!("</svg>") .)*) {
      return content;
    }
