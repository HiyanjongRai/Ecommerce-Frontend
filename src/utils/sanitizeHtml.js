/**
 * Simple client-side HTML sanitizer to prevent basic XSS attacks.
 * Allows safe tags and safe attributes, removes scripts, styles, iframes, and onload/onerror events.
 */
export default function sanitizeHtml(htmlString) {
  if (!htmlString) return '';
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    // Whitelisted safe tags
    const allowedTags = new Set([
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'span', 'div', 'img', 'a', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'sub', 'sup'
    ]);
    
    // Whitelisted safe attributes
    const allowedAttrs = new Set([
      'href', 'src', 'alt', 'title', 'class', 'id', 'width', 'height', 'target', 'rel'
    ]);

    const sanitizeElement = (el) => {
      const tagName = el.tagName.toLowerCase();
      
      // If tag is not in whitelist, remove the tag node but preserve text/children
      if (!allowedTags.has(tagName)) {
        while (el.firstChild) {
          el.parentNode.insertBefore(el.firstChild, el);
        }
        el.parentNode.removeChild(el);
        return;
      }
      
      // Sanitize attributes
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        
        // Block event handlers (on*) and non-whitelisted attributes
        if (attrName.startsWith('on') || !allowedAttrs.has(attrName)) {
          el.removeAttribute(attr.name);
        } 
        // Block javascript: href/src URIs
        else if ((attrName === 'href' || attrName === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
      
      // Recursively sanitize all child elements
      const children = Array.from(el.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          sanitizeElement(child);
        }
      }
    };
    
    // Clean all root elements inside parsed body
    const bodyChildren = Array.from(doc.body.childNodes);
    for (const child of bodyChildren) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        sanitizeElement(child);
      }
    }
    
    return doc.body.innerHTML;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Simple fallback string replacement if DOMParser fails
    return htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
}
