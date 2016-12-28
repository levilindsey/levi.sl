;/*! showdown 21-12-2016 */
(function(){
/**
 * Created by Tivie on 13-07-2015.
 */

function getDefaultOpts(simple) {
  'use strict';

  var defaultOptions = {
    omitExtraWLInCodeBlocks: {
      defaultValue: false,
      describe: 'Omit the default extra whiteline added to code blocks',
      type: 'boolean'
    },
    noHeaderId: {
      defaultValue: false,
      describe: 'Turn on/off generated header id',
      type: 'boolean'
    },
    prefixHeaderId: {
      defaultValue: false,
      describe: 'Specify a prefix to generated header ids',
      type: 'string'
    },
    headerLevelStart: {
      defaultValue: false,
      describe: 'The header blocks level start',
      type: 'integer'
    },
    parseImgDimensions: {
      defaultValue: false,
      describe: 'Turn on/off image dimension parsing',
      type: 'boolean'
    },
    simplifiedAutoLink: {
      defaultValue: false,
      describe: 'Turn on/off GFM autolink style',
      type: 'boolean'
    },
    excludeTrailingPunctuationFromURLs: {
      defaultValue: false,
      describe: 'Excludes trailing punctuation from links generated with autoLinking',
      type: 'boolean'
    },
    literalMidWordUnderscores: {
      defaultValue: false,
      describe: 'Parse midword underscores as literal underscores',
      type: 'boolean'
    },
    strikethrough: {
      defaultValue: false,
      describe: 'Turn on/off strikethrough support',
      type: 'boolean'
    },
    tables: {
      defaultValue: false,
      describe: 'Turn on/off tables support',
      type: 'boolean'
    },
    tablesHeaderId: {
      defaultValue: false,
      describe: 'Add an id to table headers',
      type: 'boolean'
    },
    ghCodeBlocks: {
      defaultValue: true,
      describe: 'Turn on/off GFM fenced code blocks support',
      type: 'boolean'
    },
    tasklists: {
      defaultValue: false,
      describe: 'Turn on/off GFM tasklist support',
      type: 'boolean'
    },
    smoothLivePreview: {
      defaultValue: false,
      describe: 'Prevents weird effects in live previews due to incomplete input',
      type: 'boolean'
    },
    smartIndentationFix: {
      defaultValue: false,
      description: 'Tries to smartly fix indentation in es6 strings',
      type: 'boolean'
    },
    disableForced4SpacesIndentedSublists: {
      defaultValue: false,
      description: 'Disables the requirement of indenting nested sublists by 4 spaces',
      type: 'boolean'
    },
    simpleLineBreaks: {
      defaultValue: false,
      description: 'Parses simple line breaks as <br> (GFM Style)',
      type: 'boolean'
    },
    requireSpaceBeforeHeadingText: {
      defaultValue: false,
      description: 'Makes adding a space between `#` and the header text mandatory (GFM Style)',
      type: 'boolean'
    }
  };
  if (simple === false) {
    return JSON.parse(JSON.stringify(defaultOptions));
  }
  var ret = {};
  for (var opt in defaultOptions) {
    if (defaultOptions.hasOwnProperty(opt)) {
      ret[opt] = defaultOptions[opt].defaultValue;
    }
  }
  return ret;
}

/**
 * Created by Tivie on 06-01-2015.
 */

// Private properties
var showdown = {},
    parsers = {},
    extensions = {},
    globalOptions = getDefaultOpts(true),
    flavor = {
      github: {
        omitExtraWLInCodeBlocks:              true,
        prefixHeaderId:                       'user-content-',
        simplifiedAutoLink:                   true,
        excludeTrailingPunctuationFromURLs:   true,
        literalMidWordUnderscores:            true,
        strikethrough:                        true,
        tables:                               true,
        tablesHeaderId:                       true,
        ghCodeBlocks:                         true,
        tasklists:                            true,
        disableForced4SpacesIndentedSublists: true,
        simpleLineBreaks:                     true,
        requireSpaceBeforeHeadingText:        true
      },
      vanilla: getDefaultOpts(true)
    };

/**
 * helper namespace
 * @type {{}}
 */
showdown.helper = {};

/**
 * TODO LEGACY SUPPORT CODE
 * @type {{}}
 */
showdown.extensions = {};

/**
 * Set a global option
 * @static
 * @param {string} key
 * @param {*} value
 * @returns {showdown}
 */
showdown.setOption = function (key, value) {
  'use strict';
  globalOptions[key] = value;
  return this;
};

/**
 * Get a global option
 * @static
 * @param {string} key
 * @returns {*}
 */
showdown.getOption = function (key) {
  'use strict';
  return globalOptions[key];
};

/**
 * Get the global options
 * @static
 * @returns {{}}
 */
showdown.getOptions = function () {
  'use strict';
  return globalOptions;
};

/**
 * Reset global options to the default values
 * @static
 */
showdown.resetOptions = function () {
  'use strict';
  globalOptions = getDefaultOpts(true);
};

/**
 * Set the flavor showdown should use as default
 * @param {string} name
 */
showdown.setFlavor = function (name) {
  'use strict';
  if (flavor.hasOwnProperty(name)) {
    var preset = flavor[name];
    for (var option in preset) {
      if (preset.hasOwnProperty(option)) {
        globalOptions[option] = preset[option];
      }
    }
  }
};

/**
 * Get the default options
 * @static
 * @param {boolean} [simple=true]
 * @returns {{}}
 */
showdown.getDefaultOptions = function (simple) {
  'use strict';
  return getDefaultOpts(simple);
};

/**
 * Get or set a subParser
 *
 * subParser(name)       - Get a registered subParser
 * subParser(name, func) - Register a subParser
 * @static
 * @param {string} name
 * @param {function} [func]
 * @returns {*}
 */
showdown.subParser = function (name, func) {
  'use strict';
  if (showdown.helper.isString(name)) {
    if (typeof func !== 'undefined') {
      parsers[name] = func;
    } else {
      if (parsers.hasOwnProperty(name)) {
        return parsers[name];
      } else {
        throw Error('SubParser named ' + name + ' not registered!');
      }
    }
  }
};

/**
 * Gets or registers an extension
 * @static
 * @param {string} name
 * @param {object|function=} ext
 * @returns {*}
 */
showdown.extension = function (name, ext) {
  'use strict';

  if (!showdown.helper.isString(name)) {
    throw Error('Extension \'name\' must be a string');
  }

  name = showdown.helper.stdExtName(name);

  // Getter
  if (showdown.helper.isUndefined(ext)) {
    if (!extensions.hasOwnProperty(name)) {
      throw Error('Extension named ' + name + ' is not registered!');
    }
    return extensions[name];

    // Setter
  } else {
    // Expand extension if it's wrapped in a function
    if (typeof ext === 'function') {
      ext = ext();
    }

    // Ensure extension is an array
    if (!showdown.helper.isArray(ext)) {
      ext = [ext];
    }

    var validExtension = validate(ext, name);

    if (validExtension.valid) {
      extensions[name] = ext;
    } else {
      throw Error(validExtension.error);
    }
  }
};

/**
 * Gets all extensions registered
 * @returns {{}}
 */
showdown.getAllExtensions = function () {
  'use strict';
  return extensions;
};

/**
 * Remove an extension
 * @param {string} name
 */
showdown.removeExtension = function (name) {
  'use strict';
  delete extensions[name];
};

/**
 * Removes all extensions
 */
showdown.resetExtensions = function () {
  'use strict';
  extensions = {};
};

/**
 * Validate extension
 * @param {array} extension
 * @param {string} name
 * @returns {{valid: boolean, error: string}}
 */
function validate(extension, name) {
  'use strict';

  var errMsg = (name) ? 'Error in ' + name + ' extension->' : 'Error in unnamed extension',
    ret = {
      valid: true,
      error: ''
    };

  if (!showdown.helper.isArray(extension)) {
    extension = [extension];
  }

  for (var i = 0; i < extension.length; ++i) {
    var baseMsg = errMsg + ' sub-extension ' + i + ': ',
        ext = extension[i];
    if (typeof ext !== 'object') {
      ret.valid = false;
      ret.error = baseMsg + 'must be an object, but ' + typeof ext + ' given';
      return ret;
    }

    if (!showdown.helper.isString(ext.type)) {
      ret.valid = false;
      ret.error = baseMsg + 'property "type" must be a string, but ' + typeof ext.type + ' given';
      return ret;
    }

    var type = ext.type = ext.type.toLowerCase();

    // normalize extension type
    if (type === 'language') {
      type = ext.type = 'lang';
    }

    if (type === 'html') {
      type = ext.type = 'output';
    }

    if (type !== 'lang' && type !== 'output' && type !== 'listener') {
      ret.valid = false;
      ret.error = baseMsg + 'type ' + type + ' is not recognized. Valid values: "lang/language", "output/html" or "listener"';
      return ret;
    }

    if (type === 'listener') {
      if (showdown.helper.isUndefined(ext.listeners)) {
        ret.valid = false;
        ret.error = baseMsg + '. Extensions of type "listener" must have a property called "listeners"';
        return ret;
      }
    } else {
      if (showdown.helper.isUndefined(ext.filter) && showdown.helper.isUndefined(ext.regex)) {
        ret.valid = false;
        ret.error = baseMsg + type + ' extensions must define either a "regex" property or a "filter" method';
        return ret;
      }
    }

    if (ext.listeners) {
      if (typeof ext.listeners !== 'object') {
        ret.valid = false;
        ret.error = baseMsg + '"listeners" property must be an object but ' + typeof ext.listeners + ' given';
        return ret;
      }
      for (var ln in ext.listeners) {
        if (ext.listeners.hasOwnProperty(ln)) {
          if (typeof ext.listeners[ln] !== 'function') {
            ret.valid = false;
            ret.error = baseMsg + '"listeners" property must be an hash of [event name]: [callback]. listeners.' + ln +
              ' must be a function but ' + typeof ext.listeners[ln] + ' given';
            return ret;
          }
        }
      }
    }

    if (ext.filter) {
      if (typeof ext.filter !== 'function') {
        ret.valid = false;
        ret.error = baseMsg + '"filter" must be a function, but ' + typeof ext.filter + ' given';
        return ret;
      }
    } else if (ext.regex) {
      if (showdown.helper.isString(ext.regex)) {
        ext.regex = new RegExp(ext.regex, 'g');
      }
      if (!ext.regex instanceof RegExp) {
        ret.valid = false;
        ret.error = baseMsg + '"regex" property must either be a string or a RegExp object, but ' + typeof ext.regex + ' given';
        return ret;
      }
      if (showdown.helper.isUndefined(ext.replace)) {
        ret.valid = false;
        ret.error = baseMsg + '"regex" extensions must implement a replace string or function';
        return ret;
      }
    }
  }
  return ret;
}

/**
 * Validate extension
 * @param {object} ext
 * @returns {boolean}
 */
showdown.validateExtension = function (ext) {
  'use strict';

  var validateExtension = validate(ext, null);
  if (!validateExtension.valid) {
    console.warn(validateExtension.error);
    return false;
  }
  return true;
};

/**
 * showdownjs helper functions
 */

if (!showdown.hasOwnProperty('helper')) {
  showdown.helper = {};
}

/**
 * Check if var is string
 * @static
 * @param {string} a
 * @returns {boolean}
 */
showdown.helper.isString = function isString(a) {
  'use strict';
  return (typeof a === 'string' || a instanceof String);
};

/**
 * Check if var is a function
 * @static
 * @param {string} a
 * @returns {boolean}
 */
showdown.helper.isFunction = function isFunction(a) {
  'use strict';
  var getType = {};
  return a && getType.toString.call(a) === '[object Function]';
};

/**
 * ForEach helper function
 * @static
 * @param {*} obj
 * @param {function} callback
 */
showdown.helper.forEach = function forEach(obj, callback) {
  'use strict';
  if (typeof obj.forEach === 'function') {
    obj.forEach(callback);
  } else {
    for (var i = 0; i < obj.length; i++) {
      callback(obj[i], i, obj);
    }
  }
};

/**
 * isArray helper function
 * @static
 * @param {*} a
 * @returns {boolean}
 */
showdown.helper.isArray = function isArray(a) {
  'use strict';
  return a.constructor === Array;
};

/**
 * Check if value is undefined
 * @static
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 */
showdown.helper.isUndefined = function isUndefined(value) {
  'use strict';
  return typeof value === 'undefined';
};

/**
 * Standardidize extension name
 * @static
 * @param {string} s extension name
 * @returns {string}
 */
showdown.helper.stdExtName = function (s) {
  'use strict';
  return s.replace(/[_-]||\s/g, '').toLowerCase();
};

function escapeCharactersCallback(wholeMatch, m1) {
  'use strict';
  var charCodeToEscape = m1.charCodeAt(0);
  return '~E' + charCodeToEscape + 'E';
}

/**
 * Callback used to escape characters when passing through String.replace
 * @static
 * @param {string} wholeMatch
 * @param {string} m1
 * @returns {string}
 */
showdown.helper.escapeCharactersCallback = escapeCharactersCallback;

/**
 * Escape characters in a string
 * @static
 * @param {string} text
 * @param {string} charsToEscape
 * @param {boolean} afterBackslash
 * @returns {XML|string|void|*}
 */
showdown.helper.escapeCharacters = function escapeCharacters(text, charsToEscape, afterBackslash) {
  'use strict';
  // First we have to escape the escape characters so that
  // we can build a character class out of them
  var regexString = '([' + charsToEscape.replace(/([\[\]\\])/g, '\\$1') + '])';

  if (afterBackslash) {
    regexString = '\\\\' + regexString;
  }

  var regex = new RegExp(regexString, 'g');
  text = text.replace(regex, escapeCharactersCallback);

  return text;
};

var rgxFindMatchPos = function (str, left, right, flags) {
  'use strict';
  var f = flags || '',
    g = f.indexOf('g') > -1,
    x = new RegExp(left + '|' + right, 'g' + f.replace(/g/g, '')),
    l = new RegExp(left, f.replace(/g/g, '')),
    pos = [],
    t, s, m, start, end;

  do {
    t = 0;
    while ((m = x.exec(str))) {
      if (l.test(m[0])) {
        if (!(t++)) {
          s = x.lastIndex;
          start = s - m[0].length;
        }
      } else if (t) {
        if (!--t) {
          end = m.index + m[0].length;
          var obj = {
            left: {start: start, end: s},
            match: {start: s, end: m.index},
            right: {start: m.index, end: end},
            wholeMatch: {start: start, end: end}
          };
          pos.push(obj);
          if (!g) {
            return pos;
          }
        }
      }
    }
  } while (t && (x.lastIndex = s));

  return pos;
};

/**
 * matchRecursiveRegExp
 *
 * (c) 2007 Steven Levithan <stevenlevithan.com>
 * MIT License
 *
 * Accepts a string to search, a left and right format delimiter
 * as regex patterns, and optional regex flags. Returns an array
 * of matches, allowing nested instances of left/right delimiters.
 * Use the "g" flag to return all matches, otherwise only the
 * first is returned. Be careful to ensure that the left and
 * right format delimiters produce mutually exclusive matches.
 * Backreferences are not supported within the right delimiter
 * due to how it is internally combined with the left delimiter.
 * When matching strings whose format delimiters are unbalanced
 * to the left or right, the output is intentionally as a
 * conventional regex library with recursion support would
 * produce, e.g. "<<x>" and "<x>>" both produce ["x"] when using
 * "<" and ">" as the delimiters (both strings contain a single,
 * balanced instance of "<x>").
 *
 * examples:
 * matchRecursiveRegExp("test", "\\(", "\\)")
 * returns: []
 * matchRecursiveRegExp("<t<<e>><s>>t<>", "<", ">", "g")
 * returns: ["t<<e>><s>", ""]
 * matchRecursiveRegExp("<div id=\"x\">test</div>", "<div\\b[^>]*>", "</div>", "gi")
 * returns: ["test"]
 */
showdown.helper.matchRecursiveRegExp = function (str, left, right, flags) {
  'use strict';

  var matchPos = rgxFindMatchPos (str, left, right, flags),
    results = [];

  for (var i = 0; i < matchPos.length; ++i) {
    results.push([
      str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end),
      str.slice(matchPos[i].match.start, matchPos[i].match.end),
      str.slice(matchPos[i].left.start, matchPos[i].left.end),
      str.slice(matchPos[i].right.start, matchPos[i].right.end)
    ]);
  }
  return results;
};

/**
 *
 * @param {string} str
 * @param {string|function} replacement
 * @param {string} left
 * @param {string} right
 * @param {string} flags
 * @returns {string}
 */
showdown.helper.replaceRecursiveRegExp = function (str, replacement, left, right, flags) {
  'use strict';

  if (!showdown.helper.isFunction(replacement)) {
    var repStr = replacement;
    replacement = function () {
      return repStr;
    };
  }

  var matchPos = rgxFindMatchPos(str, left, right, flags),
      finalStr = str,
      lng = matchPos.length;

  if (lng > 0) {
    var bits = [];
    if (matchPos[0].wholeMatch.start !== 0) {
      bits.push(str.slice(0, matchPos[0].wholeMatch.start));
    }
    for (var i = 0; i < lng; ++i) {
      bits.push(
        replacement(
          str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end),
          str.slice(matchPos[i].match.start, matchPos[i].match.end),
          str.slice(matchPos[i].left.start, matchPos[i].left.end),
          str.slice(matchPos[i].right.start, matchPos[i].right.end)
        )
      );
      if (i < lng - 1) {
        bits.push(str.slice(matchPos[i].wholeMatch.end, matchPos[i + 1].wholeMatch.start));
      }
    }
    if (matchPos[lng - 1].wholeMatch.end < str.length) {
      bits.push(str.slice(matchPos[lng - 1].wholeMatch.end));
    }
    finalStr = bits.join('');
  }
  return finalStr;
};

/**
 * POLYFILLS
 */
if (showdown.helper.isUndefined(console)) {
  console = {
    warn: function (msg) {
      'use strict';
      alert(msg);
    },
    log: function (msg) {
      'use strict';
      alert(msg);
    },
    error: function (msg) {
      'use strict';
      throw msg;
    }
  };
}

/**
 * Created by Estevao on 31-05-2015.
 */

/**
 * Showdown Converter class
 * @class
 * @param {object} [converterOptions]
 * @returns {Converter}
 */
showdown.Converter = function (converterOptions) {
  'use strict';

  var
      /**
       * Options used by this converter
       * @private
       * @type {{}}
       */
      options = {},

      /**
       * Language extensions used by this converter
       * @private
       * @type {Array}
       */
      langExtensions = [],

      /**
       * Output modifiers extensions used by this converter
       * @private
       * @type {Array}
       */
      outputModifiers = [],

      /**
       * Event listeners
       * @private
       * @type {{}}
       */
      listeners = {};

  _constructor();

  /**
   * Converter constructor
   * @private
   */
  function _constructor() {
    converterOptions = converterOptions || {};

    for (var gOpt in globalOptions) {
      if (globalOptions.hasOwnProperty(gOpt)) {
        options[gOpt] = globalOptions[gOpt];
      }
    }

    // Merge options
    if (typeof converterOptions === 'object') {
      for (var opt in converterOptions) {
        if (converterOptions.hasOwnProperty(opt)) {
          options[opt] = converterOptions[opt];
        }
      }
    } else {
      throw Error('Converter expects the passed parameter to be an object, but ' + typeof converterOptions +
      ' was passed instead.');
    }

    if (options.extensions) {
      showdown.helper.forEach(options.extensions, _parseExtension);
    }
  }

  /**
   * Parse extension
   * @param {*} ext
   * @param {string} [name='']
   * @private
   */
  function _parseExtension(ext, name) {

    name = name || null;
    // If it's a string, the extension was previously loaded
    if (showdown.helper.isString(ext)) {
      ext = showdown.helper.stdExtName(ext);
      name = ext;

      // LEGACY_SUPPORT CODE
      if (showdown.extensions[ext]) {
        console.warn('DEPRECATION WARNING: ' + ext + ' is an old extension that uses a deprecated loading method.' +
          'Please inform the developer that the extension should be updated!');
        legacyExtensionLoading(showdown.extensions[ext], ext);
        return;
      // END LEGACY SUPPORT CODE

      } else if (!showdown.helper.isUndefined(extensions[ext])) {
        ext = extensions[ext];

      } else {
        throw Error('Extension "' + ext + '" could not be loaded. It was either not found or is not a valid extension.');
      }
    }

    if (typeof ext === 'function') {
      ext = ext();
    }

    if (!showdown.helper.isArray(ext)) {
      ext = [ext];
    }

    var validExt = validate(ext, name);
    if (!validExt.valid) {
      throw Error(validExt.error);
    }

    for (var i = 0; i < ext.length; ++i) {
      switch (ext[i].type) {

        case 'lang':
          langExtensions.push(ext[i]);
          break;

        case 'output':
          outputModifiers.push(ext[i]);
          break;
      }
      if (ext[i].hasOwnProperty('listeners')) {
        for (var ln in ext[i].listeners) {
          if (ext[i].listeners.hasOwnProperty(ln)) {
            listen(ln, ext[i].listeners[ln]);
          }
        }
      }
    }

  }

  /**
   * LEGACY_SUPPORT
   * @param {*} ext
   * @param {string} name
   */
  function legacyExtensionLoading(ext, name) {
    if (typeof ext === 'function') {
      ext = ext(new showdown.Converter());
    }
    if (!showdown.helper.isArray(ext)) {
      ext = [ext];
    }
    var valid = validate(ext, name);

    if (!valid.valid) {
      throw Error(valid.error);
    }

    for (var i = 0; i < ext.length; ++i) {
      switch (ext[i].type) {
        case 'lang':
          langExtensions.push(ext[i]);
          break;
        case 'output':
          outputModifiers.push(ext[i]);
          break;
        default:// should never reach here
          throw Error('Extension loader error: Type unrecognized!!!');
      }
    }
  }

  /**
   * Listen to an event
   * @param {string} name
   * @param {function} callback
   */
  function listen(name, callback) {
    if (!showdown.helper.isString(name)) {
      throw Error('Invalid argument in converter.listen() method: name must be a string, but ' + typeof name + ' given');
    }

    if (typeof callback !== 'function') {
      throw Error('Invalid argument in converter.listen() method: callback must be a function, but ' + typeof callback + ' given');
    }

    if (!listeners.hasOwnProperty(name)) {
      listeners[name] = [];
    }
    listeners[name].push(callback);
  }

  function rTrimInputText(text) {
    var rsp = text.match(/^\s*/)[0].length,
        rgx = new RegExp('^\\s{0,' + rsp + '}', 'gm');
    return text.replace(rgx, '');
  }

  /**
   * Dispatch an event
   * @private
   * @param {string} evtName Event name
   * @param {string} text Text
   * @param {{}} options Converter Options
   * @param {{}} globals
   * @returns {string}
   */
  this._dispatch = function dispatch (evtName, text, options, globals) {
    if (listeners.hasOwnProperty(evtName)) {
      for (var ei = 0; ei < listeners[evtName].length; ++ei) {
        var nText = listeners[evtName][ei](evtName, text, this, options, globals);
        if (nText && typeof nText !== 'undefined') {
          text = nText;
        }
      }
    }
    return text;
  };

  /**
   * Listen to an event
   * @param {string} name
   * @param {function} callback
   * @returns {showdown.Converter}
   */
  this.listen = function (name, callback) {
    listen(name, callback);
    return this;
  };

  /**
   * Converts a markdown string into HTML
   * @param {string} text
   * @returns {*}
   */
  this.makeHtml = function (text) {
    //check if text is not falsy
    if (!text) {
      return text;
    }

    var globals = {
      gHtmlBlocks:     [],
      gHtmlMdBlocks:   [],
      gHtmlSpans:      [],
      gUrls:           {},
      gTitles:         {},
      gDimensions:     {},
      gListLevel:      0,
      hashLinkCounts:  {},
      langExtensions:  langExtensions,
      outputModifiers: outputModifiers,
      converter:       this,
      ghCodeBlocks:    []
    };

    // attacklab: Replace ~ with ~T
    // This lets us use tilde as an escape char to avoid md5 hashes
    // The choice of character is arbitrary; anything that isn't
    // magic in Markdown will work.
    text = text.replace(/~/g, '~T');

    // attacklab: Replace $ with ~D
    // RegExp interprets $ as a special character
    // when it's in a replacement string
    text = text.replace(/\$/g, '~D');

    // Standardize line endings
    text = text.replace(/\r\n/g, '\n'); // DOS to Unix
    text = text.replace(/\r/g, '\n'); // Mac to Unix

    // Stardardize line spaces (nbsp causes trouble in older browsers and some regex flavors)
    text = text.replace(/\u00A0/g, ' ');

    if (options.smartIndentationFix) {
      text = rTrimInputText(text);
    }

    // Make sure text begins and ends with a couple of newlines:
    text = '\n\n' + text + '\n\n';

    // detab
    text = showdown.subParser('detab')(text, options, globals);

    // stripBlankLines
    text = showdown.subParser('stripBlankLines')(text, options, globals);

    //run languageExtensions
    showdown.helper.forEach(langExtensions, function (ext) {
      text = showdown.subParser('runExtension')(ext, text, options, globals);
    });

    // run the sub parsers
    text = showdown.subParser('hashPreCodeTags')(text, options, globals);
    text = showdown.subParser('githubCodeBlocks')(text, options, globals);
    text = showdown.subParser('hashHTMLBlocks')(text, options, globals);
    text = showdown.subParser('hashHTMLSpans')(text, options, globals);
    text = showdown.subParser('stripLinkDefinitions')(text, options, globals);
    text = showdown.subParser('blockGamut')(text, options, globals);
    text = showdown.subParser('unhashHTMLSpans')(text, options, globals);
    text = showdown.subParser('unescapeSpecialChars')(text, options, globals);

    // attacklab: Restore dollar signs
    text = text.replace(/~D/g, '$$');

    // attacklab: Restore tildes
    text = text.replace(/~T/g, '~');

    // Run output modifiers
    showdown.helper.forEach(outputModifiers, function (ext) {
      text = showdown.subParser('runExtension')(ext, text, options, globals);
    });

    return text;
  };

  /**
   * Set an option of this Converter instance
   * @param {string} key
   * @param {*} value
   */
  this.setOption = function (key, value) {
    options[key] = value;
  };

  /**
   * Get the option of this Converter instance
   * @param {string} key
   * @returns {*}
   */
  this.getOption = function (key) {
    return options[key];
  };

  /**
   * Get the options of this Converter instance
   * @returns {{}}
   */
  this.getOptions = function () {
    return options;
  };

  /**
   * Add extension to THIS converter
   * @param {{}} extension
   * @param {string} [name=null]
   */
  this.addExtension = function (extension, name) {
    name = name || null;
    _parseExtension(extension, name);
  };

  /**
   * Use a global registered extension with THIS converter
   * @param {string} extensionName Name of the previously registered extension
   */
  this.useExtension = function (extensionName) {
    _parseExtension(extensionName);
  };

  /**
   * Set the flavor THIS converter should use
   * @param {string} name
   */
  this.setFlavor = function (name) {
    if (flavor.hasOwnProperty(name)) {
      var preset = flavor[name];
      for (var option in preset) {
        if (preset.hasOwnProperty(option)) {
          options[option] = preset[option];
        }
      }
    }
  };

  /**
   * Remove an extension from THIS converter.
   * Note: This is a costly operation. It's better to initialize a new converter
   * and specify the extensions you wish to use
   * @param {Array} extension
   */
  this.removeExtension = function (extension) {
    if (!showdown.helper.isArray(extension)) {
      extension = [extension];
    }
    for (var a = 0; a < extension.length; ++a) {
      var ext = extension[a];
      for (var i = 0; i < langExtensions.length; ++i) {
        if (langExtensions[i] === ext) {
          langExtensions[i].splice(i, 1);
        }
      }
      for (var ii = 0; ii < outputModifiers.length; ++i) {
        if (outputModifiers[ii] === ext) {
          outputModifiers[ii].splice(i, 1);
        }
      }
    }
  };

  /**
   * Get all extension of THIS converter
   * @returns {{language: Array, output: Array}}
   */
  this.getAllExtensions = function () {
    return {
      language: langExtensions,
      output: outputModifiers
    };
  };
};

/**
 * Turn Markdown link shortcuts into XHTML <a> tags.
 */
showdown.subParser('anchors', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('anchors.before', text, options, globals);

  var writeAnchorTag = function (wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
    if (showdown.helper.isUndefined(m7)) {
      m7 = '';
    }
    wholeMatch = m1;
    var linkText = m2,
        linkId = m3.toLowerCase(),
        url = m4,
        title = m7;

    if (!url) {
      if (!linkId) {
        // lower-case and turn embedded newlines into spaces
        linkId = linkText.toLowerCase().replace(/ ?\n/g, ' ');
      }
      url = '#' + linkId;

      if (!showdown.helper.isUndefined(globals.gUrls[linkId])) {
        url = globals.gUrls[linkId];
        if (!showdown.helper.isUndefined(globals.gTitles[linkId])) {
          title = globals.gTitles[linkId];
        }
      } else {
        if (wholeMatch.search(/\(\s*\)$/m) > -1) {
          // Special case for explicit empty url
          url = '';
        } else {
          return wholeMatch;
        }
      }
    }

    url = showdown.helper.escapeCharacters(url, '*_', false);
    var result = '<a href="' + url + '"';

    if (title !== '' && title !== null) {
      title = title.replace(/"/g, '&quot;');
      title = showdown.helper.escapeCharacters(title, '*_', false);
      result += ' title="' + title + '"';
    }

    result += '>' + linkText + '</a>';

    return result;
  };

  // First, handle reference-style links: [link text] [id]
  text = text.replace(/(\[((?:\[[^\]]*]|[^\[\]])*)][ ]?(?:\n[ ]*)?\[(.*?)])()()()()/g, writeAnchorTag);

  // Next, inline-style links: [link text](url "optional title")
  text = text.replace(/(\[((?:\[[^\]]*]|[^\[\]])*)]\([ \t]*()<?(.*?(?:\(.*?\).*?)?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,
                      writeAnchorTag);

  // Last, handle reference-style shortcuts: [link text]
  // These must come last in case you've also got [link test][1]
  // or [link test](/foo)
  text = text.replace(/(\[([^\[\]]+)])()()()()()/g, writeAnchorTag);

  text = globals.converter._dispatch('anchors.after', text, options, globals);
  return text;
});

showdown.subParser('autoLinks', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('autoLinks.before', text, options, globals);

  var simpleURLRegex  = /\b(((https?|ftp|dict):\/\/|www\.)[^'">\s]+\.[^'">\s]+)()(?=\s|$)(?!["<>])/gi,
      simpleURLRegex2 = /\b(((https?|ftp|dict):\/\/|www\.)[^'">\s]+\.[^'">\s]+?)([.!?()]?)(?=\s|$)(?!["<>])/gi,
      delimUrlRegex   = /<(((https?|ftp|dict):\/\/|www\.)[^'">\s]+)>/gi,
      simpleMailRegex = /(?:^|\s)([A-Za-z0-9!#$%&'*+-/=?^_`{|}~.]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)(?:$|\s)/gi,
      delimMailRegex  = /<(?:mailto:)?([-.\w]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi;

  text = text.replace(delimUrlRegex, replaceLink);
  text = text.replace(delimMailRegex, replaceMail);
  // simpleURLRegex  = /\b(((https?|ftp|dict):\/\/|www\.)[-.+~:?#@!$&'()*,;=[\]\w]+)\b/gi,
  // Email addresses: <address@domain.foo>

  if (options.simplifiedAutoLink) {
    if (options.excludeTrailingPunctuationFromURLs) {
      text = text.replace(simpleURLRegex2, replaceLink);
    } else {
      text = text.replace(simpleURLRegex, replaceLink);
    }
    text = text.replace(simpleMailRegex, replaceMail);
  }

  function replaceLink(wm, link, m2, m3, trailingPunctuation) {
    var lnkTxt = link,
        append = '';
    if (/^www\./i.test(link)) {
      link = link.replace(/^www\./i, 'http://www.');
    }
    if (options.excludeTrailingPunctuationFromURLs && trailingPunctuation) {
      append = trailingPunctuation;
    }
    return '<a href="' + link + '">' + lnkTxt + '</a>' + append;
  }

  function replaceMail(wholeMatch, mail) {
    var unescapedStr = showdown.subParser('unescapeSpecialChars')(mail);
    return showdown.subParser('encodeEmailAddress')(unescapedStr);
  }

  text = globals.converter._dispatch('autoLinks.after', text, options, globals);

  return text;
});

/**
 * These are all the transformations that form block-level
 * tags like paragraphs, headers, and list items.
 */
showdown.subParser('blockGamut', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('blockGamut.before', text, options, globals);

  // we parse blockquotes first so that we can have headings and hrs
  // inside blockquotes
  text = showdown.subParser('blockQuotes')(text, options, globals);
  text = showdown.subParser('headers')(text, options, globals);

  // Do Horizontal Rules:
  var key = showdown.subParser('hashBlock')('<hr />', options, globals);
  text = text.replace(/^ {0,2}( ?-){3,}[ \t]*$/gm, key);
  text = text.replace(/^ {0,2}( ?\*){3,}[ \t]*$/gm, key);
  text = text.replace(/^ {0,2}( ?_){3,}[ \t]*$/gm, key);

  text = showdown.subParser('lists')(text, options, globals);
  text = showdown.subParser('codeBlocks')(text, options, globals);
  text = showdown.subParser('tables')(text, options, globals);

  // We already ran _HashHTMLBlocks() before, in Markdown(), but that
  // was to escape raw HTML in the original Markdown source. This time,
  // we're escaping the markup we've just created, so that we don't wrap
  // <p> tags around block-level tags.
  text = showdown.subParser('hashHTMLBlocks')(text, options, globals);
  text = showdown.subParser('paragraphs')(text, options, globals);

  text = globals.converter._dispatch('blockGamut.after', text, options, globals);

  return text;
});

showdown.subParser('blockQuotes', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('blockQuotes.before', text, options, globals);

  text = text.replace(/((^ {0,3}>[ \t]?.+\n(.+\n)*\n*)+)/gm, function (wholeMatch, m1) {
    var bq = m1;

    // attacklab: hack around Konqueror 3.5.4 bug:
    // "----------bug".replace(/^-/g,"") == "bug"
    bq = bq.replace(/^[ \t]*>[ \t]?/gm, '~0'); // trim one level of quoting

    // attacklab: clean up hack
    bq = bq.replace(/~0/g, '');

    bq = bq.replace(/^[ \t]+$/gm, ''); // trim whitespace-only lines
    bq = showdown.subParser('githubCodeBlocks')(bq, options, globals);
    bq = showdown.subParser('blockGamut')(bq, options, globals); // recurse

    bq = bq.replace(/(^|\n)/g, '$1  ');
    // These leading spaces screw with <pre> content, so we need to fix that:
    bq = bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, function (wholeMatch, m1) {
      var pre = m1;
      // attacklab: hack around Konqueror 3.5.4 bug:
      pre = pre.replace(/^  /mg, '~0');
      pre = pre.replace(/~0/g, '');
      return pre;
    });

    return showdown.subParser('hashBlock')('<blockquote>\n' + bq + '\n</blockquote>', options, globals);
  });

  text = globals.converter._dispatch('blockQuotes.after', text, options, globals);
  return text;
});

/**
 * Process Markdown `<pre><code>` blocks.
 */
showdown.subParser('codeBlocks', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('codeBlocks.before', text, options, globals);

  // sentinel workarounds for lack of \A and \Z, safari\khtml bug
  text += '~0';

  var pattern = /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g;
  text = text.replace(pattern, function (wholeMatch, m1, m2) {
    var codeblock = m1,
        nextChar = m2,
        end = '\n';

    codeblock = showdown.subParser('outdent')(codeblock);
    codeblock = showdown.subParser('encodeCode')(codeblock);
    codeblock = showdown.subParser('detab')(codeblock);
    codeblock = codeblock.replace(/^\n+/g, ''); // trim leading newlines
    codeblock = codeblock.replace(/\n+$/g, ''); // trim trailing newlines

    if (options.omitExtraWLInCodeBlocks) {
      end = '';
    }

    codeblock = '<pre><code>' + codeblock + end + '</code></pre>';

    return showdown.subParser('hashBlock')(codeblock, options, globals) + nextChar;
  });

  // strip sentinel
  text = text.replace(/~0/, '');

  text = globals.converter._dispatch('codeBlocks.after', text, options, globals);
  return text;
});

/**
 *
 *   *  Backtick quotes are used for <code></code> spans.
 *
 *   *  You can use multiple backticks as the delimiters if you want to
 *     include literal backticks in the code span. So, this input:
 *
 *         Just type ``foo `bar` baz`` at the prompt.
 *
 *       Will translate to:
 *
 *         <p>Just type <code>foo `bar` baz</code> at the prompt.</p>
 *
 *    There's no arbitrary limit to the number of backticks you
 *    can use as delimters. If you need three consecutive backticks
 *    in your code, use four for delimiters, etc.
 *
 *  *  You can use spaces to get literal backticks at the edges:
 *
 *         ... type `` `bar` `` ...
 *
 *       Turns to:
 *
 *         ... type <code>`bar`</code> ...
 */
showdown.subParser('codeSpans', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('codeSpans.before', text, options, globals);

  /*
   text = text.replace(/
   (^|[^\\])					// Character before opening ` can't be a backslash
   (`+)						// $2 = Opening run of `
   (							// $3 = The code block
   [^\r]*?
   [^`]					// attacklab: work around lack of lookbehind
   )
   \2							// Matching closer
   (?!`)
   /gm, function(){...});
   */

  if (typeof(text) === 'undefined') {
    text = '';
  }
  text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
    function (wholeMatch, m1, m2, m3) {
      var c = m3;
      c = c.replace(/^([ \t]*)/g, '');	// leading whitespace
      c = c.replace(/[ \t]*$/g, '');	// trailing whitespace
      c = showdown.subParser('encodeCode')(c);
      return m1 + '<code>' + c + '</code>';
    }
  );

  text = globals.converter._dispatch('codeSpans.after', text, options, globals);
  return text;
});

/**
 * Convert all tabs to spaces
 */
showdown.subParser('detab', function (text) {
  'use strict';

  // expand first n-1 tabs
  text = text.replace(/\t(?=\t)/g, '    '); // g_tab_width

  // replace the nth with two sentinels
  text = text.replace(/\t/g, '~A~B');

  // use the sentinel to anchor our regex so it doesn't explode
  text = text.replace(/~B(.+?)~A/g, function (wholeMatch, m1) {
    var leadingText = m1,
        numSpaces = 4 - leadingText.length % 4;  // g_tab_width

    // there *must* be a better way to do this:
    for (var i = 0; i < numSpaces; i++) {
      leadingText += ' ';
    }

    return leadingText;
  });

  // clean up sentinels
  text = text.replace(/~A/g, '    ');  // g_tab_width
  text = text.replace(/~B/g, '');

  return text;

});

/**
 * Smart processing for ampersands and angle brackets that need to be encoded.
 */
showdown.subParser('encodeAmpsAndAngles', function (text) {
  'use strict';
  // Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
  // http://bumppo.net/projects/amputator/
  text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, '&amp;');

  // Encode naked <'s
  text = text.replace(/<(?![a-z\/?\$!])/gi, '&lt;');

  return text;
});

/**
 * Returns the string, with after processing the following backslash escape sequences.
 *
 * attacklab: The polite way to do this is with the new escapeCharacters() function:
 *
 *    text = escapeCharacters(text,"\\",true);
 *    text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
 *
 * ...but we're sidestepping its use of the (slow) RegExp constructor
 * as an optimization for Firefox.  This function gets called a LOT.
 */
showdown.subParser('encodeBackslashEscapes', function (text) {
  'use strict';
  text = text.replace(/\\(\\)/g, showdown.helper.escapeCharactersCallback);
  text = text.replace(/\\([`*_{}\[\]()>#+-.!])/g, showdown.helper.escapeCharactersCallback);
  return text;
});

/**
 * Encode/escape certain characters inside Markdown code runs.
 * The point is that in code, these characters are literals,
 * and lose their special Markdown meanings.
 */
showdown.subParser('encodeCode', function (text) {
  'use strict';

  // Encode all ampersands; HTML entities are not
  // entities within a Markdown code span.
  text = text.replace(/&/g, '&amp;');

  // Do the angle bracket song and dance:
  text = text.replace(/</g, '&lt;');
  text = text.replace(/>/g, '&gt;');

  // Now, escape characters that are magic in Markdown:
  text = showdown.helper.escapeCharacters(text, '*_{}[]\\', false);

  // jj the line above breaks this:
  //---
  //* Item
  //   1. Subitem
  //            special char: *
  // ---

  return text;
});

/**
 *  Input: an email address, e.g. "foo@example.com"
 *
 *  Output: the email address as a mailto link, with each character
 *    of the address encoded as either a decimal or hex entity, in
 *    the hopes of foiling most address harvesting spam bots. E.g.:
 *
 *    <a href="&#x6D;&#97;&#105;&#108;&#x74;&#111;:&#102;&#111;&#111;&#64;&#101;
 *       x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;">&#102;&#111;&#111;
 *       &#64;&#101;x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;</a>
 *
 *  Based on a filter by Matthew Wickline, posted to the BBEdit-Talk
 *  mailing list: <http://tinyurl.com/yu7ue>
 *
 */
showdown.subParser('encodeEmailAddress', function (addr) {
  'use strict';

  var encode = [
    function (ch) {
      return '&#' + ch.charCodeAt(0) + ';';
    },
    function (ch) {
      return '&#x' + ch.charCodeAt(0).toString(16) + ';';
    },
    function (ch) {
      return ch;
    }
  ];

  addr = 'mailto:' + addr;

  addr = addr.replace(/./g, function (ch) {
    if (ch === '@') {
      // this *must* be encoded. I insist.
      ch = encode[Math.floor(Math.random() * 2)](ch);
    } else if (ch !== ':') {
      // leave ':' alone (to spot mailto: later)
      var r = Math.random();
      // roughly 10% raw, 45% hex, 45% dec
      ch = (
        r > 0.9 ? encode[2](ch) : r > 0.45 ? encode[1](ch) : encode[0](ch)
      );
    }
    return ch;
  });

  addr = '<a href="' + addr + '">' + addr + '</a>';
  addr = addr.replace(/">.+:/g, '">'); // strip the mailto: from the visible part

  return addr;
});

/**
 * Within tags -- meaning between < and > -- encode [\ ` * _] so they
 * don't conflict with their use in Markdown for code, italics and strong.
 */
showdown.subParser('escapeSpecialCharsWithinTagAttributes', function (text) {
  'use strict';

  // Build a regex to find HTML tags and comments.  See Friedl's
  // "Mastering Regular Expressions", 2nd Ed., pp. 200-201.
  var regex = /(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;

  text = text.replace(regex, function (wholeMatch) {
    var tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g, '$1`');
    tag = showdown.helper.escapeCharacters(tag, '\\`*_', false);
    return tag;
  });

  return text;
});

/**
 * Handle github codeblocks prior to running HashHTML so that
 * HTML contained within the codeblock gets escaped properly
 * Example:
 * ```ruby
 *     def hello_world(x)
 *       puts "Hello, #{x}"
 *     end
 * ```
 */
showdown.subParser('githubCodeBlocks', function (text, options, globals) {
  'use strict';

  // early exit if option is not enabled
  if (!options.ghCodeBlocks) {
    return text;
  }

  text = globals.converter._dispatch('githubCodeBlocks.before', text, options, globals);

  text += '~0';

  text = text.replace(/(?:^|\n)```(.*)\n([\s\S]*?)\n```/g, function (wholeMatch, language, codeblock) {
    var end = (options.omitExtraWLInCodeBlocks) ? '' : '\n';

    // First parse the github code block
    codeblock = showdown.subParser('encodeCode')(codeblock);
    codeblock = showdown.subParser('detab')(codeblock);
    codeblock = codeblock.replace(/^\n+/g, ''); // trim leading newlines
    codeblock = codeblock.replace(/\n+$/g, ''); // trim trailing whitespace

    codeblock = '<pre><code' + (language ? ' class="' + language + ' language-' + language + '"' : '') + '>' + codeblock + end + '</code></pre>';

    codeblock = showdown.subParser('hashBlock')(codeblock, options, globals);

    // Since GHCodeblocks can be false positives, we need to
    // store the primitive text and the parsed text in a global var,
    // and then return a token
    return '\n\n~G' + (globals.ghCodeBlocks.push({text: wholeMatch, codeblock: codeblock}) - 1) + 'G\n\n';
  });

  // attacklab: strip sentinel
  text = text.replace(/~0/, '');

  return globals.converter._dispatch('githubCodeBlocks.after', text, options, globals);
});

showdown.subParser('hashBlock', function (text, options, globals) {
  'use strict';
  text = text.replace(/(^\n+|\n+$)/g, '');
  return '\n\n~K' + (globals.gHtmlBlocks.push(text) - 1) + 'K\n\n';
});

showdown.subParser('hashElement', function (text, options, globals) {
  'use strict';

  return function (wholeMatch, m1) {
    var blockText = m1;

    // Undo double lines
    blockText = blockText.replace(/\n\n/g, '\n');
    blockText = blockText.replace(/^\n/, '');

    // strip trailing blank lines
    blockText = blockText.replace(/\n+$/g, '');

    // Replace the element text with a marker ("~KxK" where x is its key)
    blockText = '\n\n~K' + (globals.gHtmlBlocks.push(blockText) - 1) + 'K\n\n';

    return blockText;
  };
});

showdown.subParser('hashHTMLBlocks', function (text, options, globals) {
  'use strict';

  var blockTags = [
      'pre',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'table',
      'dl',
      'ol',
      'ul',
      'script',
      'noscript',
      'form',
      'fieldset',
      'iframe',
      'math',
      'style',
      'section',
      'header',
      'footer',
      'nav',
      'article',
      'aside',
      'address',
      'audio',
      'canvas',
      'figure',
      'hgroup',
      'output',
      'video',
      'p'
    ],
    repFunc = function (wholeMatch, match, left, right) {
      var txt = wholeMatch;
      // check if this html element is marked as markdown
      // if so, it's contents should be parsed as markdown
      if (left.search(/\bmarkdown\b/) !== -1) {
        txt = left + globals.converter.makeHtml(match) + right;
      }
      return '\n\n~K' + (globals.gHtmlBlocks.push(txt) - 1) + 'K\n\n';
    };

  for (var i = 0; i < blockTags.length; ++i) {
    text = showdown.helper.replaceRecursiveRegExp(text, repFunc, '^ {0,3}<' + blockTags[i] + '\\b[^>]*>', '</' + blockTags[i] + '>', 'gim');
  }

  // HR SPECIAL CASE
  text = text.replace(/(\n {0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,
    showdown.subParser('hashElement')(text, options, globals));

  // Special case for standalone HTML comments
  text = showdown.helper.replaceRecursiveRegExp(text, function (txt) {
    return '\n\n~K' + (globals.gHtmlBlocks.push(txt) - 1) + 'K\n\n';
  }, '^ {0,3}<!--', '-->', 'gm');

  // PHP and ASP-style processor instructions (<?...?> and <%...%>)
  text = text.replace(/(?:\n\n)( {0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,
    showdown.subParser('hashElement')(text, options, globals));

  return text;
});

/**
 * Hash span elements that should not be parsed as markdown
 */
showdown.subParser('hashHTMLSpans', function (text, config, globals) {
  'use strict';

  var matches = showdown.helper.matchRecursiveRegExp(text, '<code\\b[^>]*>', '</code>', 'gi');

  for (var i = 0; i < matches.length; ++i) {
    text = text.replace(matches[i][0], '~C' + (globals.gHtmlSpans.push(matches[i][0]) - 1) + 'C');
  }
  return text;
});

/**
 * Unhash HTML spans
 */
showdown.subParser('unhashHTMLSpans', function (text, config, globals) {
  'use strict';

  for (var i = 0; i < globals.gHtmlSpans.length; ++i) {
    text = text.replace('~C' + i + 'C', globals.gHtmlSpans[i]);
  }

  return text;
});

/**
 * Hash span elements that should not be parsed as markdown
 */
showdown.subParser('hashPreCodeTags', function (text, config, globals) {
  'use strict';

  var repFunc = function (wholeMatch, match, left, right) {
    // encode html entities
    var codeblock = left + showdown.subParser('encodeCode')(match) + right;
    return '\n\n~G' + (globals.ghCodeBlocks.push({text: wholeMatch, codeblock: codeblock}) - 1) + 'G\n\n';
  };

  text = showdown.helper.replaceRecursiveRegExp(text, repFunc, '^ {0,3}<pre\\b[^>]*>\\s*<code\\b[^>]*>', '^ {0,3}</code>\\s*</pre>', 'gim');
  return text;
});

showdown.subParser('headers', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('headers.before', text, options, globals);

  var prefixHeader = options.prefixHeaderId,
      headerLevelStart = (isNaN(parseInt(options.headerLevelStart))) ? 1 : parseInt(options.headerLevelStart),

  // Set text-style headers:
  //	Header 1
  //	========
  //
  //	Header 2
  //	--------
  //
      setextRegexH1 = (options.smoothLivePreview) ? /^(.+)[ \t]*\n={2,}[ \t]*\n+/gm : /^(.+)[ \t]*\n=+[ \t]*\n+/gm,
      setextRegexH2 = (options.smoothLivePreview) ? /^(.+)[ \t]*\n-{2,}[ \t]*\n+/gm : /^(.+)[ \t]*\n-+[ \t]*\n+/gm;

  text = text.replace(setextRegexH1, function (wholeMatch, m1) {

    var spanGamut = showdown.subParser('spanGamut')(m1, options, globals),
        hID = (options.noHeaderId) ? '' : ' id="' + headerId(m1) + '"',
        hLevel = headerLevelStart,
        hashBlock = '<h' + hLevel + hID + '>' + spanGamut + '</h' + hLevel + '>';
    return showdown.subParser('hashBlock')(hashBlock, options, globals);
  });

  text = text.replace(setextRegexH2, function (matchFound, m1) {
    var spanGamut = showdown.subParser('spanGamut')(m1, options, globals),
        hID = (options.noHeaderId) ? '' : ' id="' + headerId(m1) + '"',
        hLevel = headerLevelStart + 1,
      hashBlock = '<h' + hLevel + hID + '>' + spanGamut + '</h' + hLevel + '>';
    return showdown.subParser('hashBlock')(hashBlock, options, globals);
  });

  // atx-style headers:
  //  # Header 1
  //  ## Header 2
  //  ## Header 2 with closing hashes ##
  //  ...
  //  ###### Header 6
  //
  var atxStyle = (options.requireSpaceBeforeHeadingText) ? /^(#{1,6})[ \t]+(.+?)[ \t]*#*\n+/gm : /^(#{1,6})[ \t]*(.+?)[ \t]*#*\n+/gm;

  text = text.replace(atxStyle, function (wholeMatch, m1, m2) {
    var span = showdown.subParser('spanGamut')(m2, options, globals),
        hID = (options.noHeaderId) ? '' : ' id="' + headerId(m2) + '"',
        hLevel = headerLevelStart - 1 + m1.length,
        header = '<h' + hLevel + hID + '>' + span + '</h' + hLevel + '>';

    return showdown.subParser('hashBlock')(header, options, globals);
  });

  function headerId(m) {
    var title, escapedId = m.replace(/[^\w]/g, '').toLowerCase();

    if (globals.hashLinkCounts[escapedId]) {
      title = escapedId + '-' + (globals.hashLinkCounts[escapedId]++);
    } else {
      title = escapedId;
      globals.hashLinkCounts[escapedId] = 1;
    }

    // Prefix id to prevent causing inadvertent pre-existing style matches.
    if (prefixHeader === true) {
      prefixHeader = 'section';
    }

    if (showdown.helper.isString(prefixHeader)) {
      return prefixHeader + title;
    }
    return title;
  }

  text = globals.converter._dispatch('headers.after', text, options, globals);
  return text;
});

/**
 * Turn Markdown image shortcuts into <img> tags.
 */
showdown.subParser('images', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('images.before', text, options, globals);

  var inlineRegExp    = /!\[(.*?)]\s?\([ \t]*()<?(\S+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(['"])(.*?)\6[ \t]*)?\)/g,
      referenceRegExp = /!\[([^\]]*?)] ?(?:\n *)?\[(.*?)]()()()()()/g;

  function writeImageTag (wholeMatch, altText, linkId, url, width, height, m5, title) {

    var gUrls   = globals.gUrls,
        gTitles = globals.gTitles,
        gDims   = globals.gDimensions;

    linkId = linkId.toLowerCase();

    if (!title) {
      title = '';
    }

    if (url === '' || url === null) {
      if (linkId === '' || linkId === null) {
        // lower-case and turn embedded newlines into spaces
        linkId = altText.toLowerCase().replace(/ ?\n/g, ' ');
      }
      url = '#' + linkId;

      if (!showdown.helper.isUndefined(gUrls[linkId])) {
        url = gUrls[linkId];
        if (!showdown.helper.isUndefined(gTitles[linkId])) {
          title = gTitles[linkId];
        }
        if (!showdown.helper.isUndefined(gDims[linkId])) {
          width = gDims[linkId].width;
          height = gDims[linkId].height;
        }
      } else {
        return wholeMatch;
      }
    }

    altText = altText.replace(/"/g, '&quot;');
    altText = showdown.helper.escapeCharacters(altText, '*_', false);
    url = showdown.helper.escapeCharacters(url, '*_', false);
    var result = '<img src="' + url + '" alt="' + altText + '"';

    if (title) {
      title = title.replace(/"/g, '&quot;');
      title = showdown.helper.escapeCharacters(title, '*_', false);
      result += ' title="' + title + '"';
    }

    if (width && height) {
      width  = (width === '*') ? 'auto' : width;
      height = (height === '*') ? 'auto' : height;

      result += ' width="' + width + '"';
      result += ' height="' + height + '"';
    }

    result += ' />';

    return result;
  }

  // First, handle reference-style labeled images: ![alt text][id]
  text = text.replace(referenceRegExp, writeImageTag);

  // Next, handle inline images:  ![alt text](url =<width>x<height> "optional title")
  text = text.replace(inlineRegExp, writeImageTag);

  text = globals.converter._dispatch('images.after', text, options, globals);
  return text;
});

showdown.subParser('italicsAndBold', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('italicsAndBold.before', text, options, globals);

  if (options.literalMidWordUnderscores) {
    //underscores
    // Since we are consuming a \s character, we need to add it
    text = text.replace(/(^|\s|>|\b)__(?=\S)([\s\S]+?)__(?=\b|<|\s|$)/gm, '$1<strong>$2</strong>');
    text = text.replace(/(^|\s|>|\b)_(?=\S)([\s\S]+?)_(?=\b|<|\s|$)/gm, '$1<em>$2</em>');
    //asterisks
    text = text.replace(/(\*\*)(?=\S)([^\r]*?\S[*]*)\1/g, '<strong>$2</strong>');
    text = text.replace(/(\*)(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>');

  } else {
    // <strong> must go first:
    text = text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g, '<strong>$2</strong>');
    text = text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>');
  }

  text = globals.converter._dispatch('italicsAndBold.after', text, options, globals);
  return text;
});

/**
 * Form HTML ordered (numbered) and unordered (bulleted) lists.
 */
showdown.subParser('lists', function (text, options, globals) {
  'use strict';
  text = globals.converter._dispatch('lists.before', text, options, globals);

  /**
   * Process the contents of a single ordered or unordered list, splitting it
   * into individual list items.
   * @param {string} listStr
   * @param {boolean} trimTrailing
   * @returns {string}
   */
  function processListItems (listStr, trimTrailing) {
    // The $g_list_level global keeps track of when we're inside a list.
    // Each time we enter a list, we increment it; when we leave a list,
    // we decrement. If it's zero, we're not in a list anymore.
    //
    // We do this because when we're not inside a list, we want to treat
    // something like this:
    //
    //    I recommend upgrading to version
    //    8. Oops, now this line is treated
    //    as a sub-list.
    //
    // As a single paragraph, despite the fact that the second line starts
    // with a digit-period-space sequence.
    //
    // Whereas when we're inside a list (or sub-list), that line will be
    // treated as the start of a sub-list. What a kludge, huh? This is
    // an aspect of Markdown's syntax that's hard to parse perfectly
    // without resorting to mind-reading. Perhaps the solution is to
    // change the syntax rules such that sub-lists must start with a
    // starting cardinal number; e.g. "1." or "a.".
    globals.gListLevel++;

    // trim trailing blank lines:
    listStr = listStr.replace(/\n{2,}$/, '\n');

    // attacklab: add sentinel to emulate \z
    listStr += '~0';

    var rgx = /(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[(x|X| )?])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(~0| {0,3}([*+-]|\d+[.])[ \t]+))/gm,
        isParagraphed = (/\n[ \t]*\n(?!~0)/.test(listStr));

    // Since version 1.5, nesting sublists requires 4 spaces (or 1 tab) indentation,
    // which is a syntax breaking change
    // activating this option reverts to old behavior
    if (options.disableForced4SpacesIndentedSublists) {
      rgx = /(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[(x|X| )?])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm;
    }

    listStr = listStr.replace(rgx, function (wholeMatch, m1, m2, m3, m4, taskbtn, checked) {
      checked = (checked && checked.trim() !== '');

      var item = showdown.subParser('outdent')(m4, options, globals),
          bulletStyle = '';

      // Support for github tasklists
      if (taskbtn && options.tasklists) {
        bulletStyle = ' class="task-list-item" style="list-style-type: none;"';
        item = item.replace(/^[ \t]*\[(x|X| )?]/m, function () {
          var otp = '<input type="checkbox" disabled style="margin: 0px 0.35em 0.25em -1.6em; vertical-align: middle;"';
          if (checked) {
            otp += ' checked';
          }
          otp += '>';
          return otp;
        });
      }

      // ISSUE #312
      // This input: - - - a
      // causes trouble to the parser, since it interprets it as:
      // <ul><li><li><li>a</li></li></li></ul>
      // instead of:
      // <ul><li>- - a</li></ul>
      // So, to prevent it, we will put a marker (~A)in the beginning of the line
      // Kind of hackish/monkey patching, but seems more effective than overcomplicating the list parser
      item = item.replace(/^([-*+]|\d\.)[ \t]+[\S\n ]*/g, function (wm2) {
        return '~A' + wm2;
      });

      // m1 - Leading line or
      // Has a double return (multi paragraph) or
      // Has sublist
      if (m1 || (item.search(/\n{2,}/) > -1)) {
        item = showdown.subParser('githubCodeBlocks')(item, options, globals);
        item = showdown.subParser('blockGamut')(item, options, globals);
      } else {
        // Recursion for sub-lists:
        item = showdown.subParser('lists')(item, options, globals);
        item = item.replace(/\n$/, ''); // chomp(item)
        item = showdown.subParser('hashHTMLBlocks')(item, options, globals);
        item = item.replace(/\n\n+/g, '\n\n');
        if (isParagraphed) {
          item = showdown.subParser('paragraphs')(item, options, globals);
        } else {
          item = showdown.subParser('spanGamut')(item, options, globals);
        }
      }

      // now we need to remove the marker (~A)
      item = item.replace('~A', '');
      // we can finally wrap the line in list item tags
      item =  '<li' + bulletStyle + '>' + item + '</li>\n';

      return item;
    });

    // attacklab: strip sentinel
    listStr = listStr.replace(/~0/g, '');

    globals.gListLevel--;

    if (trimTrailing) {
      listStr = listStr.replace(/\s+$/, '');
    }

    return listStr;
  }

  /**
   * Check and parse consecutive lists (better fix for issue #142)
   * @param {string} list
   * @param {string} listType
   * @param {boolean} trimTrailing
   * @returns {string}
   */
  function parseConsecutiveLists(list, listType, trimTrailing) {
    // check if we caught 2 or more consecutive lists by mistake
    // we use the counterRgx, meaning if listType is UL we look for OL and vice versa
    var olRgx = (options.disableForced4SpacesIndentedSublists) ? /^ ?\d+\.[ \t]/gm : /^ {0,3}\d+\.[ \t]/gm,
        ulRgx = (options.disableForced4SpacesIndentedSublists) ? /^ ?[*+-][ \t]/gm : /^ {0,3}[*+-][ \t]/gm,
        counterRxg = (listType === 'ul') ? olRgx : ulRgx,
        result = '';

    if (list.search(counterRxg) !== -1) {
      (function parseCL(txt) {
        var pos = txt.search(counterRxg);
        if (pos !== -1) {
          // slice
          result += '\n<' + listType + '>\n' + processListItems(txt.slice(0, pos), !!trimTrailing) + '</' + listType + '>\n';

          // invert counterType and listType
          listType = (listType === 'ul') ? 'ol' : 'ul';
          counterRxg = (listType === 'ul') ? olRgx : ulRgx;

          //recurse
          parseCL(txt.slice(pos));
        } else {
          result += '\n<' + listType + '>\n' + processListItems(txt, !!trimTrailing) + '</' + listType + '>\n';
        }
      })(list);
    } else {
      result = '\n<' + listType + '>\n' + processListItems(list, !!trimTrailing) + '</' + listType + '>\n';
    }

    return result;
  }

  // add sentinel to hack around khtml/safari bug:
  // http://bugs.webkit.org/show_bug.cgi?id=11231
  text += '~0';

  if (globals.gListLevel) {
    text = text.replace(/^(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm,
      function (wholeMatch, list, m2) {
        var listType = (m2.search(/[*+-]/g) > -1) ? 'ul' : 'ol';
        return parseConsecutiveLists(list, listType, true);
      }
    );
  } else {
    text = text.replace(/(\n\n|^\n?)(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm,
      function (wholeMatch, m1, list, m3) {
        var listType = (m3.search(/[*+-]/g) > -1) ? 'ul' : 'ol';
        return parseConsecutiveLists(list, listType, false);
      }
    );
  }

  // strip sentinel
  text = text.replace(/~0/, '');
  text = globals.converter._dispatch('lists.after', text, options, globals);
  return text;
});

/**
 * Remove one level of line-leading tabs or spaces
 */
showdown.subParser('outdent', function (text) {
  'use strict';

  // attacklab: hack around Konqueror 3.5.4 bug:
  // "----------bug".replace(/^-/g,"") == "bug"
  text = text.replace(/^(\t|[ ]{1,4})/gm, '~0'); // attacklab: g_tab_width

  // attacklab: clean up hack
  text = text.replace(/~0/g, '');

  return text;
});

/**
 *
 */
showdown.subParser('paragraphs', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('paragraphs.before', text, options, globals);
  // Strip leading and trailing lines:
  text = text.replace(/^\n+/g, '');
  text = text.replace(/\n+$/g, '');

  var grafs = text.split(/\n{2,}/g),
      grafsOut = [],
      end = grafs.length; // Wrap <p> tags

  for (var i = 0; i < end; i++) {
    var str = grafs[i];
    // if this is an HTML marker, copy it
    if (str.search(/~(K|G)(\d+)\1/g) >= 0) {
      grafsOut.push(str);
    } else {
      str = showdown.subParser('spanGamut')(str, options, globals);
      str = str.replace(/^([ \t]*)/g, '<p>');
      str += '</p>';
      grafsOut.push(str);
    }
  }

  /** Unhashify HTML blocks */
  end = grafsOut.length;
  for (i = 0; i < end; i++) {
    var blockText = '',
        grafsOutIt = grafsOut[i],
        codeFlag = false;
    // if this is a marker for an html block...
    while (grafsOutIt.search(/~(K|G)(\d+)\1/) >= 0) {
      var delim = RegExp.$1,
          num   = RegExp.$2;

      if (delim === 'K') {
        blockText = globals.gHtmlBlocks[num];
      } else {
        // we need to check if ghBlock is a false positive
        if (codeFlag) {
          // use encoded version of all text
          blockText = showdown.subParser('encodeCode')(globals.ghCodeBlocks[num].text);
        } else {
          blockText = globals.ghCodeBlocks[num].codeblock;
        }
      }
      blockText = blockText.replace(/\$/g, '$$$$'); // Escape any dollar signs

      grafsOutIt = grafsOutIt.replace(/(\n\n)?~(K|G)\d+\2(\n\n)?/, blockText);
      // Check if grafsOutIt is a pre->code
      if (/^<pre\b[^>]*>\s*<code\b[^>]*>/.test(grafsOutIt)) {
        codeFlag = true;
      }
    }
    grafsOut[i] = grafsOutIt;
  }
  text = grafsOut.join('\n');
  // Strip leading and trailing lines:
  text = text.replace(/^\n+/g, '');
  text = text.replace(/\n+$/g, '');
  return globals.converter._dispatch('paragraphs.after', text, options, globals);
});

/**
 * Run extension
 */
showdown.subParser('runExtension', function (ext, text, options, globals) {
  'use strict';

  if (ext.filter) {
    text = ext.filter(text, globals.converter, options);

  } else if (ext.regex) {
    // TODO remove this when old extension loading mechanism is deprecated
    var re = ext.regex;
    if (!re instanceof RegExp) {
      re = new RegExp(re, 'g');
    }
    text = text.replace(re, ext.replace);
  }

  return text;
});

/**
 * These are all the transformations that occur *within* block-level
 * tags like paragraphs, headers, and list items.
 */
showdown.subParser('spanGamut', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('spanGamut.before', text, options, globals);
  text = showdown.subParser('codeSpans')(text, options, globals);
  text = showdown.subParser('escapeSpecialCharsWithinTagAttributes')(text, options, globals);
  text = showdown.subParser('encodeBackslashEscapes')(text, options, globals);

  // Process anchor and image tags. Images must come first,
  // because ![foo][f] looks like an anchor.
  text = showdown.subParser('images')(text, options, globals);
  text = showdown.subParser('anchors')(text, options, globals);

  // Make links out of things like `<http://example.com/>`
  // Must come after _DoAnchors(), because you can use < and >
  // delimiters in inline links like [this](<url>).
  text = showdown.subParser('autoLinks')(text, options, globals);
  text = showdown.subParser('encodeAmpsAndAngles')(text, options, globals);
  text = showdown.subParser('italicsAndBold')(text, options, globals);
  text = showdown.subParser('strikethrough')(text, options, globals);

  // Do hard breaks
  if (options.simpleLineBreaks) {
    // GFM style hard breaks
    text = text.replace(/\b\n\b/g, '<br />\n');
  } else {
    // Vanilla hard breaks
    text = text.replace(/\b  +\n\b/g, '<br />\n');
  }

  text = globals.converter._dispatch('spanGamut.after', text, options, globals);
  return text;
});

showdown.subParser('strikethrough', function (text, options, globals) {
  'use strict';

  if (options.strikethrough) {
    text = globals.converter._dispatch('strikethrough.before', text, options, globals);
    text = text.replace(/(?:~T){2}([\s\S]+?)(?:~T){2}/g, '<del>$1</del>');
    text = globals.converter._dispatch('strikethrough.after', text, options, globals);
  }

  return text;
});

/**
 * Strip any lines consisting only of spaces and tabs.
 * This makes subsequent regexs easier to write, because we can
 * match consecutive blank lines with /\n+/ instead of something
 * contorted like /[ \t]*\n+/
 */
showdown.subParser('stripBlankLines', function (text) {
  'use strict';
  return text.replace(/^[ \t]+$/mg, '');
});

/**
 * Strips link definitions from text, stores the URLs and titles in
 * hash references.
 * Link defs are in the form: ^[id]: url "optional title"
 */
showdown.subParser('stripLinkDefinitions', function (text, options, globals) {
  'use strict';

  var regex = /^ {0,3}\[(.+)]:[ \t]*\n?[ \t]*<?(\S+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n+|(?=~0))/gm;

  // attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
  text += '~0';

  text = text.replace(regex, function (wholeMatch, linkId, url, width, height, blankLines, title) {
    linkId = linkId.toLowerCase();
    globals.gUrls[linkId] = showdown.subParser('encodeAmpsAndAngles')(url);  // Link IDs are case-insensitive

    if (blankLines) {
      // Oops, found blank lines, so it's not a title.
      // Put back the parenthetical statement we stole.
      return blankLines + title;

    } else {
      if (title) {
        globals.gTitles[linkId] = title.replace(/"|'/g, '&quot;');
      }
      if (options.parseImgDimensions && width && height) {
        globals.gDimensions[linkId] = {
          width:  width,
          height: height
        };
      }
    }
    // Completely remove the definition from the text
    return '';
  });

  // attacklab: strip sentinel
  text = text.replace(/~0/, '');

  return text;
});

showdown.subParser('tables', function (text, options, globals) {
  'use strict';

  if (!options.tables) {
    return text;
  }

  var tableRgx = /^ {0,3}\|?.+\|.+\n[ \t]{0,3}\|?[ \t]*:?[ \t]*(?:-|=){2,}[ \t]*:?[ \t]*\|[ \t]*:?[ \t]*(?:-|=){2,}[\s\S]+?(?:\n\n|~0)/gm;

  function parseStyles(sLine) {
    if (/^:[ \t]*--*$/.test(sLine)) {
      return ' style="text-align:left;"';
    } else if (/^--*[ \t]*:[ \t]*$/.test(sLine)) {
      return ' style="text-align:right;"';
    } else if (/^:[ \t]*--*[ \t]*:$/.test(sLine)) {
      return ' style="text-align:center;"';
    } else {
      return '';
    }
  }

  function parseHeaders(header, style) {
    var id = '';
    header = header.trim();
    if (options.tableHeaderId) {
      id = ' id="' + header.replace(/ /g, '_').toLowerCase() + '"';
    }
    header = showdown.subParser('spanGamut')(header, options, globals);

    return '<th' + id + style + '>' + header + '</th>\n';
  }

  function parseCells(cell, style) {
    var subText = showdown.subParser('spanGamut')(cell, options, globals);
    return '<td' + style + '>' + subText + '</td>\n';
  }

  function buildTable(headers, cells) {
    var tb = '<table>\n<thead>\n<tr>\n',
        tblLgn = headers.length;

    for (var i = 0; i < tblLgn; ++i) {
      tb += headers[i];
    }
    tb += '</tr>\n</thead>\n<tbody>\n';

    for (i = 0; i < cells.length; ++i) {
      tb += '<tr>\n';
      for (var ii = 0; ii < tblLgn; ++ii) {
        tb += cells[i][ii];
      }
      tb += '</tr>\n';
    }
    tb += '</tbody>\n</table>\n';
    return tb;
  }

  text = globals.converter._dispatch('tables.before', text, options, globals);

  text = text.replace(tableRgx, function (rawTable) {

    var i, tableLines = rawTable.split('\n');

    // strip wrong first and last column if wrapped tables are used
    for (i = 0; i < tableLines.length; ++i) {
      if (/^ {0,3}\|/.test(tableLines[i])) {
        tableLines[i] = tableLines[i].replace(/^ {0,3}\|/, '');
      }
      if (/\|[ \t]*$/.test(tableLines[i])) {
        tableLines[i] = tableLines[i].replace(/\|[ \t]*$/, '');
      }
    }

    var rawHeaders = tableLines[0].split('|').map(function (s) { return s.trim();}),
        rawStyles = tableLines[1].split('|').map(function (s) { return s.trim();}),
        rawCells = [],
        headers = [],
        styles = [],
        cells = [];

    tableLines.shift();
    tableLines.shift();

    for (i = 0; i < tableLines.length; ++i) {
      if (tableLines[i].trim() === '') {
        continue;
      }
      rawCells.push(
        tableLines[i]
          .split('|')
          .map(function (s) {
            return s.trim();
          })
      );
    }

    if (rawHeaders.length < rawStyles.length) {
      return rawTable;
    }

    for (i = 0; i < rawStyles.length; ++i) {
      styles.push(parseStyles(rawStyles[i]));
    }

    for (i = 0; i < rawHeaders.length; ++i) {
      if (showdown.helper.isUndefined(styles[i])) {
        styles[i] = '';
      }
      headers.push(parseHeaders(rawHeaders[i], styles[i]));
    }

    for (i = 0; i < rawCells.length; ++i) {
      var row = [];
      for (var ii = 0; ii < headers.length; ++ii) {
        if (showdown.helper.isUndefined(rawCells[i][ii])) {

        }
        row.push(parseCells(rawCells[i][ii], styles[ii]));
      }
      cells.push(row);
    }

    return buildTable(headers, cells);
  });

  text = globals.converter._dispatch('tables.after', text, options, globals);

  return text;
});

/**
 * Swap back in all the special characters we've hidden.
 */
showdown.subParser('unescapeSpecialChars', function (text) {
  'use strict';

  text = text.replace(/~E(\d+)E/g, function (wholeMatch, m1) {
    var charCodeToReplace = parseInt(m1);
    return String.fromCharCode(charCodeToReplace);
  });
  return text;
});

var root = this;

// CommonJS/nodeJS Loader
if (typeof module !== 'undefined' && module.exports) {
  module.exports = showdown;

// AMD Loader
} else if (typeof define === 'function' && define.amd) {
  define(function () {
    'use strict';
    return showdown;
  });

// Regular Browser loader
} else {
  root.showdown = showdown;
}
}).call(this);

//# sourceMappingURL=showdown.js.map

/*! showdown-twitter 26-11-2016 */
  'use strict';

  if (typeof showdown !== 'undefined') {
    extension(showdown);
  } else if (typeof define === 'function' && define.amd) {
    define(['showdown'], extension);
  } else if (typeof exports === 'object') {
    module.exports = extension(require('showdown'));
  } else {
    throw Error('Could not find showdown library');
  }

}(function (showdown) {
  'use strict';

  showdown.extension('twitter', function () {
    return [
      {
        type:    'lang',
        regex:   '\\B(\\\\)?@([\\S]+)\\b',
        replace: function (match, leadingSlash, username) {
          if (leadingSlash === '\\') {
            return match;
          } else {
            return '<a href="http://twitter.com/' + username + '">@' + username + '</a>';
          }
        }
      },
      {
        type:    'lang',
        regex:   '\\B(\\\\)?#([\\S]+)\\b',
        replace: function (match, leadingSlash, tag) {
          if (leadingSlash === '\\') {
            return match;
          } else {
            return '<a href="http://twitter.com/search/%23' + tag + '">#' + tag + '</a>';
          }
        }
      },
      {
        type:    'lang',
        regex:   '\\\\@',
        replace: '@'
      }
    ];
  });
}));

//# sourceMappingURL=showdown-twitter.js.map
/*! showdown-prettify 06-01-2016 */
(function (extension) {
  'use strict';

  if (typeof showdown !== 'undefined') {
    extension(showdown);
  } else if (typeof define === 'function' && define.amd) {
    define(['showdown'], extension);
  } else if (typeof exports === 'object') {
    module.exports = extension(require('showdown'));
  } else {
    throw Error('Could not find showdown library');
  }

}(function (showdown) {
  'use strict';
  showdown.extension('prettify', function () {
    return [{
      type:   'output',
      filter: function (source) {
        return source.replace(/(<pre[^>]*>)?[\n\s]?<code([^>]*)>/gi, function (match, pre, codeClass) {
          if (pre) {
            return '<pre class="prettyprint linenums"><code' + codeClass + '>';
          } else {
            return ' <code class="prettyprint">';
          }
        });
      }
    }];
  });
}));

//# sourceMappingURL=showdown-prettify.js.map
'use strict';

/**
 * This module defines a singleton that helps coordinate the various components of the hex-grid
 * package.
 *
 * The controller singleton handles provides convenient helper functions for creating and running
 * grids and animations. It stores these objects and updates them in response to various system
 * events--e.g., window resize.
 *
 * @module controller
 */
(function () {

  var controller = {},
      config = {},
      internal = {};

  controller.persistentJobs = {
    ColorShiftJob: {
      constructorName: 'ColorShiftJob',
      jobs: [],
      create: createPersistentJob.bind(controller, 'ColorShiftJob'),
      start: restartPersistentJob.bind(controller, 'ColorShiftJob'),
      cancel: cancelPersistentJob.bind(controller, 'ColorShiftJob')
    },
    ColorWaveJob: {
      constructorName: 'ColorWaveJob',
      jobs: [],
      create: createPersistentJob.bind(controller, 'ColorWaveJob'),
      start: restartPersistentJob.bind(controller, 'ColorWaveJob'),
      cancel: cancelPersistentJob.bind(controller, 'ColorWaveJob')
    },
    DisplacementWaveJob: {
      constructorName: 'DisplacementWaveJob',
      jobs: [],
      create: createPersistentJob.bind(controller, 'DisplacementWaveJob'),
      start: restartPersistentJob.bind(controller, 'DisplacementWaveJob'),
      cancel: cancelPersistentJob.bind(controller, 'DisplacementWaveJob')
    },

    // --- For internal use --- //

    ColorResetJob: {
      constructorName: 'ColorResetJob',
      jobs: [],
      create: createPersistentJob.bind(controller, 'ColorResetJob'),
      start: restartPersistentJob.bind(controller, 'ColorResetJob'),
      cancel: cancelPersistentJob.bind(controller, 'ColorResetJob')
    },
    DisplacementResetJob: {
      constructorName: 'DisplacementResetJob',
      jobs: [],
      create: createPersistentJob.bind(controller, 'DisplacementResetJob'),
      start: restartPersistentJob.bind(controller, 'DisplacementResetJob'),
      cancel: cancelPersistentJob.bind(controller, 'DisplacementResetJob')
    }
  };

  controller.transientJobs = {
    OpenPostJob: {
      constructorName: 'OpenPostJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'OpenPostJob'),
      createRandom: openRandomPost,
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'OpenPostJob'),
      canRunWithOpenGrid: false
    },
    ClosePostJob: {
      constructorName: 'ClosePostJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'ClosePostJob'),
      createRandom: closePost,
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'ClosePostJob'),
      canRunWithOpenGrid: true
    },
    CarouselImageSlideJob: {
      constructorName: 'CarouselImageSlideJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'CarouselImageSlideJob'),
      createRandom: null,
      toggleRecurrence: null,
      canRunWithOpenGrid: true
    },
    DilateSectorsJob: {
      constructorName: 'DilateSectorsJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'DilateSectorsJob'),
      createRandom: null,
      toggleRecurrence: null,
      canRunWithOpenGrid: true
    },
    FadePostJob: {
      constructorName: 'FadePostJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'FadePostJob'),
      createRandom: null,
      toggleRecurrence: null,
      canRunWithOpenGrid: true
    },
    DisplacementRadiateJob: {
      constructorName: 'DisplacementRadiateJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'DisplacementRadiateJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'DisplacementRadiateJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'DisplacementRadiateJob'),
      canRunWithOpenGrid: true
    },
    HighlightHoverJob: {
      constructorName: 'HighlightHoverJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'HighlightHoverJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'HighlightHoverJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'HighlightHoverJob'),
      canRunWithOpenGrid: true
    },
    HighlightRadiateJob: {
      constructorName: 'HighlightRadiateJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'HighlightRadiateJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'HighlightRadiateJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'HighlightRadiateJob'),
      canRunWithOpenGrid: true
    },
    IntraTileRadiateJob: {
      constructorName: 'IntraTileRadiateJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'IntraTileRadiateJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'IntraTileRadiateJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'IntraTileRadiateJob'),
      canRunWithOpenGrid: true
    },
    LineJob: {
      constructorName: 'LineJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, randomLineCreator, 'LineJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'LineJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'LineJob'),
      canRunWithOpenGrid: false
    },
    LinesRadiateJob: {
      constructorName: 'LinesRadiateJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, linesRadiateCreator, 'LinesRadiateJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'LinesRadiateJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'LinesRadiateJob'),
      canRunWithOpenGrid: false
    },
    PanJob: {
      constructorName: 'PanJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'PanJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'PanJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'PanJob'),
      canRunWithOpenGrid: true
    },
    SpreadJob: {
      constructorName: 'SpreadJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'SpreadJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'SpreadJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'SpreadJob'),
      canRunWithOpenGrid: true
    },
    TileBorderJob: {
      constructorName: 'TileBorderJob',
      jobs: [],
      timeouts: [],
      create: createTransientJob.bind(controller, null, 'TileBorderJob'),
      createRandom: createTransientJobWithARandomTile.bind(controller, 'TileBorderJob'),
      toggleRecurrence: toggleJobRecurrence.bind(controller, 'TileBorderJob'),
      canRunWithOpenGrid: true
    }
  };

  internal.grids = [];
  internal.inputs = [];
  internal.annotations = [];
  internal.postData = [];
  internal.performanceCheckJob = true;

  controller.isLowPerformanceBrowser = false;
  controller.isSafariBrowser = false;
  controller.isIosBrowser = false;
  controller.isSmallScreen = false;

  // ------------------------------------------------------------------------------------------- //
  // Expose this singleton

  controller.config = config;

  controller.createNewHexGrid = createNewHexGrid;
  controller.resetGrid = resetGrid;
  controller.resetPersistentJobs = resetPersistentJobs;
  controller.setGridPostData = setGridPostData;
  controller.filterGridPostDataByCategory = filterGridPostDataByCategory;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.controller = controller;

  window.addEventListener('load', initController, false);

  function initController() {
    window.removeEventListener('load', initController);

    var debouncedResize = window.hg.util.debounce(resize, 300);
    window.addEventListener('resize', debouncedResize, false);
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * Starts repeating any AnimationJobs that are configured to recur.
   *
   * @param {Window.hg.Grid} grid
   */
  function startRecurringAnimations(grid) {
    Object.keys(controller.transientJobs).forEach(function (key) {
      var config = window.hg[controller.transientJobs[key].constructorName].config;

      if (config.isRecurring) {
        controller.transientJobs[key].toggleRecurrence(grid, true, config.avgDelay,
            config.delayDeviationRange);
      }
    });
  }

  /**
   * @param {String} jobId
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   * @param {*} [extraArg]
   * @returns {AnimationJob}
   */
  function generalTransientJobCreator(jobId, grid, tile, onComplete, extraArg) {
    return new window.hg[controller.transientJobs[jobId].constructorName](grid, tile, onComplete,
        extraArg);
  }

  /**
   * @param {?Function} creator
   * @param {Array.<AnimationJob>} jobId
   * @param {Grid} grid
   * @param {?Tile} tile
   * @param {*} [extraArg]
   * @returns {?AnimationJob}
   */
  function createTransientJob(creator, jobId, grid, tile, extraArg) {
    var job;

    if (!grid.isPostOpen || controller.transientJobs[jobId].canRunWithOpenGrid) {
      creator = creator || generalTransientJobCreator.bind(controller, jobId);

      // Create the job with whatever custom logic is needed for this particular type of job
      job = creator(grid, tile, onComplete, extraArg);

      // Store a reference to this job within the controller
      controller.transientJobs[jobId].jobs[grid.index].push(job);
      window.hg.animator.startJob(job);

      return job;
    } else {
      console.log('Cannot create a ' + controller.transientJobs[jobId].constructorName +
          ' while the Grid is expanded');

      return null;
    }

    // ---  --- //

    function onComplete() {
      // Destroy both references to this now-complete job
      controller.transientJobs[jobId].jobs[grid.index].splice(
          controller.transientJobs[jobId].jobs[grid.index].indexOf(job), 1);
    }
  }

  /**
   * @param {String} jobId
   * @param {Grid} grid
   * @returns {?AnimationJob}
   */
  function createTransientJobWithARandomTile(jobId, grid) {
    return controller.transientJobs[jobId].create(grid, getRandomOriginalTile(grid));
  }

  /**
   * Toggles whether an AnimationJob is automatically repeated.
   *
   * @param {String} jobId
   * @param {Grid} grid
   * @param {Boolean} isRecurring
   * @param {Number} avgDelay
   * @param {Number} delayDeviationRange
   */
  function toggleJobRecurrence(jobId, grid, isRecurring, avgDelay, delayDeviationRange) {
    var minDelay, maxDelay, actualDelayRange, jobTimeouts;

    jobTimeouts = controller.transientJobs[jobId].timeouts;

    // Compute the delay deviation range
    minDelay = avgDelay - delayDeviationRange * 0.5;
    minDelay = minDelay > 0 ? minDelay : 1;
    maxDelay = avgDelay + delayDeviationRange * 0.5;
    actualDelayRange = maxDelay - minDelay;

    // Stop any pre-existing recurrence
    if (jobTimeouts[grid.index]) {
      clearTimeout(jobTimeouts[grid.index]);
      jobTimeouts[grid.index] = null;
    }

    // Should we start the recurrence?
    if (isRecurring) {
      jobTimeouts[grid.index] = setTimeout(recur, avgDelay);
    }

    // ---  --- //

    /**
     * Creates a new occurrence of the AnimationJob and starts a new timeout to repeat this.
     */
    function recur() {
      var delay = Math.random() * actualDelayRange + minDelay;
      controller.transientJobs[jobId].createRandom(grid);
      jobTimeouts[grid.index] = setTimeout(recur, delay);
    }
  }

  /**
   * @param {String} jobId
   * @param {Grid} grid
   */
  function createPersistentJob(jobId, grid) {
    var jobDefinition, job;

    jobDefinition = controller.persistentJobs[jobId];

    job = new window.hg[jobDefinition.constructorName](grid);
    jobDefinition.jobs[grid.index].push(job);
    jobDefinition.start(grid, jobDefinition.jobs[grid.index].length - 1);
  }

  /**
   * @param {String} jobId
   * @param {Grid} grid
   * @param {Number} [jobIndex] If not given, ALL persistent jobs (of this bound type) will be
   * restarted for the given grid.
   */
  function restartPersistentJob(jobId, grid, jobIndex) {
    if (typeof jobIndex !== 'undefined') {
      window.hg.animator.startJob(controller.persistentJobs[jobId].jobs[grid.index][jobIndex]);
    } else {
      controller.persistentJobs[jobId].jobs[grid.index].forEach(window.hg.animator.startJob);
    }
  }

  /**
   * @param {String} jobId
   * @param {Grid} grid
   * @param {Number} [jobIndex] If not given, ALL persistent jobs (of this bound type) will be
   * cancelled for the given grid.
   */
  function cancelPersistentJob(jobId, grid, jobIndex) {
    if (typeof jobIndex !== 'undefined') {
      controller.persistentJobs[jobId].jobs[grid.index][jobIndex].cancel();
    } else {
      controller.persistentJobs[jobId].jobs[grid.index].forEach(function (job) {
        job.cancel();
      });
    }
  }

  /**
   * Resizes all of the hex-grid components.
   */
  function resize() {
    internal.grids.forEach(resetGrid);
  }

  /**
   * @param {Grid} grid
   * @returns {Tile}
   */
  function getRandomOriginalTile(grid) {
    var tileIndex = parseInt(Math.random() * grid.originalTiles.length);
    return grid.originalTiles[tileIndex];
  }

  /**
   * @param {Grid} grid
   * @returns {Tile}
   */
  function getRandomContentTile(grid) {
    var contentIndex = parseInt(Math.random() * grid.contentTiles.length);
    return grid.contentTiles[contentIndex];
  }

  // --- One-time-job creation functions --- //

  /**
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   * @returns {Window.hg.LineJob}
   */
  function randomLineCreator(grid, tile, onComplete) {
    return window.hg.LineJob.createRandomLineJob(grid, onComplete);
  }

  /**
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   * @returns {Window.hg.LinesRadiateJob}
   */
  function linesRadiateCreator(grid, tile, onComplete) {
    var job = new window.hg.LinesRadiateJob(grid, tile, onAllLinesComplete);

    // Also store references to each of the individual child lines
    job.lineJobs.forEach(function (lineJob) {
      controller.transientJobs.LineJob.jobs[grid.index].push(lineJob);
    });

    return job;

    // ---  --- //

    function onAllLinesComplete() {
      // Destroy the references to the individual child lines
      job.lineJobs.forEach(function (lineJob) {
        controller.transientJobs.LineJob.jobs[grid.index].splice(
            controller.transientJobs.LineJob.jobs[grid.index].indexOf(lineJob), 1);
      });

      onComplete();
    }
  }

  // --- One-time-job random creation functions --- //

  /**
   * @param {Grid} grid
   * @returns {?Window.hg.OpenPostJob}
   */
  function openRandomPost(grid) {
    // If no post is open, pick a random content tile, and open the post; otherwise, do nothing
    if (!grid.isPostOpen) {
      return controller.transientJobs.OpenPostJob.create(grid, getRandomContentTile(grid));
    } else {
      return null;
    }
  }

  /**
   * @param {Grid} grid
   * @returns {?Window.hg.ClosePostJob}
   */
  function closePost(grid) {
    // If a post is open, close it; otherwise, do nothing
    if (grid.isPostOpen) {
      return controller.transientJobs.ClosePostJob.create(grid, grid.expandedTile);
    } else {
      return null;
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Public static functions

  /**
   * Creates a Grid object and registers it with the animator.
   *
   * @param {HTMLElement} parent
   * @param {Array.<Object>} tileData
   * @param {Boolean} isVertical
   * @returns {Window.hg.Grid}
   */
  function createNewHexGrid(parent, tileData, isVertical) {
    var grid, index, annotations, input;

    index = internal.grids.length;

    initializeJobArraysForGrid(index);

    grid = new window.hg.Grid(index, parent, tileData, isVertical);
    internal.grids.push(grid);

    annotations = grid.annotations;
    internal.annotations.push(annotations);

    input = new window.hg.Input(grid);
    internal.inputs.push(input);

    window.hg.animator.startJob(grid);

    controller.persistentJobs.ColorResetJob.create(grid);
    controller.persistentJobs.DisplacementResetJob.create(grid);

    window.hg.animator.startJob(annotations);

    controller.persistentJobs.ColorShiftJob.create(grid);
    controller.persistentJobs.ColorWaveJob.create(grid);
    controller.persistentJobs.DisplacementWaveJob.create(grid);

    startRecurringAnimations(grid);

    handleSafariBrowser(grid);
    handleIosBrowser();
    handleSmallScreen();

    return grid;

    // ---  --- //

    function initializeJobArraysForGrid(index) {
      Object.keys(controller.persistentJobs).forEach(function (key) {
        controller.persistentJobs[key].jobs[index] = [];
      });

      Object.keys(controller.transientJobs).forEach(function (key) {
        controller.transientJobs[key].jobs[index] = [];
      });
    }
  }

  /**
   * @param {Grid} grid
   */
  function resetGrid(grid) {
    var expandedTile;
    var expandedPostId = grid.isPostOpen ? grid.expandedTile.postData.id : null;

    window.hg.animator.cancelAll();

    grid.resize();

    resetPersistentJobs(grid);

    if (expandedPostId) {
      expandedTile = getTileFromPostId(grid, expandedPostId);
      controller.transientJobs.OpenPostJob.create(grid, expandedTile);
    }

    if (internal.performanceCheckJob) {
      runPerformanceCheck();
    }

    handleSafariBrowser(grid);
    handleIosBrowser();
    handleSmallScreen();

    // ---  --- //

    function getTileFromPostId(grid, postId) {
      var i, count;

      for (i = 0, count = grid.originalTiles.length; i < count; i += 1) {
        if (grid.originalTiles[i].holdsContent && grid.originalTiles[i].postData.id === postId) {
          return grid.originalTiles[i];
        }
      }

      return null;
    }
  }

  /**
   * @param {Grid} grid
   */
  function resetPersistentJobs(grid) {
    window.hg.animator.startJob(grid);

    controller.persistentJobs.ColorResetJob.start(grid);
    controller.persistentJobs.DisplacementResetJob.start(grid);

    window.hg.animator.startJob(internal.annotations[grid.index]);

    // Don't run these persistent animations on low-performance browsers
    if (!controller.isLowPerformanceBrowser) {
      controller.persistentJobs.ColorShiftJob.start(grid);
      controller.persistentJobs.ColorWaveJob.start(grid);
      controller.persistentJobs.DisplacementWaveJob.start(grid);
    }
  }

  /**
   * @param {Grid} grid
   */
  function stopPersistentJobsForLowPerformanceBrowser(grid) {
    controller.persistentJobs.ColorShiftJob.cancel(grid);
    controller.persistentJobs.ColorWaveJob.cancel(grid);
    controller.persistentJobs.DisplacementWaveJob.cancel(grid);
  }

  /**
   * @param {Grid} grid
   * @param {Array.<PostData>} postData
   */
  function setGridPostData(grid, postData) {
    internal.postData[grid.index] = postData;

    setGridFilteredPostData(grid, postData);
  }

  /**
   * @param {Grid} grid
   * @param {String} category A value of 'all' will match all categories.
   */
  function filterGridPostDataByCategory(grid, category) {
    var matches;
    var postData = internal.postData[grid.index];

    if (category !== 'all') {
      matches = postData.filter(function (postDatum) {
        return postDatum.categories.indexOf(category) >= 0;
      });
    } else {
      matches = postData.slice(0);
    }

    setGridFilteredPostData(grid, matches);
  }

  /**
   * @param {Grid} grid
   * @param {Array.<PostData>} postData
   */
  function setGridFilteredPostData(grid, postData) {
    //TODO: check that these resets are correct
    grid.isPostOpen = false;
    grid.pagePost = null;
    grid.isTransitioning = false;
    grid.expandedTile = null;
    grid.sectors = null;
    grid.allNonContentTiles = null;

    grid.postData = postData;

    grid.computeContentIndices();

    resetGrid(grid);
  }

  /**
   * @param {Grid} grid
   */
  function handleSafariBrowser(grid) {
    if (window.hg.util.checkForSafari()) {
      console.info('Is a Safari browser');

      controller.isSafariBrowser = true;

      // Safari browsers do not recognize pointer events on SVG children that overflow the SVG container
      grid.svg.style.width = grid.parent.offsetWidth + 'px';
      grid.svg.style.height = grid.parent.offsetHeight + 'px';
    }
  }

  function handleIosBrowser() {
    if (window.hg.util.checkForIos()) {
      console.info('Is an iOS browser');

      controller.isIosBrowser = true;
    }
  }

  function handleSmallScreen() {
    if (document.documentElement.clientWidth < 800) {
      console.info('Is a small-screen browser');
      controller.isSmallScreen = true;
    } else {
      controller.isSmallScreen = false;
    }
  }

  function handleLowPerformanceBrowser() {
    window.hg.util.requestAnimationFrame(function () {
      controller.isLowPerformanceBrowser = true;

      internal.grids.forEach(stopPersistentJobsForLowPerformanceBrowser);

      resize();

      displayLowPerformanceMessage();
    });

    // ---  --- //

    function displayLowPerformanceMessage() {
      console.info('Is a low-performance browser');

      var messagePanel = document.createElement('div');
      var body = document.getElementsByTagName('body')[0];
      body.appendChild(messagePanel);

      messagePanel.innerHTML = 'Switching to low-performance mode.';
      messagePanel.style.zIndex = 5000;
      messagePanel.style.position = 'absolute';
      messagePanel.style.top = '0';
      messagePanel.style.right = '0';
      messagePanel.style.bottom = '0';
      messagePanel.style.left = '0';
      messagePanel.style.width = '70%';
      messagePanel.style.height = '70%';
      messagePanel.style.margin = 'auto';
      messagePanel.style.padding = '5%';
      messagePanel.style.fontSize = '5em';
      messagePanel.style.fontWeight = 'bold';
      messagePanel.style.opacity = '1';
      messagePanel.style.color = 'white';
      messagePanel.style.backgroundColor = 'rgba(60,0,0,0.6)';
      window.hg.util.setTransition(messagePanel, 'opacity 1s linear 1.5s');

      setTimeout(function () {
        messagePanel.style.opacity = '0';

        setTimeout(function () {
          body.removeChild(messagePanel);
        }, 2500);
      }, 10);
    }
  }

  function runPerformanceCheck() {
    var maxRatioOfMaxDeltaTimeFrames = 0.25;
    var numberOfFramesToCheck = 20;

    var frameCount, maxDeltaTimeFrameCount;

    internal.performanceCheckJob = {
      start: function (startTime) {
        frameCount = 0;
        maxDeltaTimeFrameCount = 0;
        internal.performanceCheckJob.startTime = startTime;
        internal.performanceCheckJob.isComplete = false;
      },
      update: function (currentTime, deltaTime) {
        frameCount++;

        // Does the current frame fail the speed test?
        if (deltaTime >= window.hg.animator.config.deltaTimeUpperThreshold) {
          maxDeltaTimeFrameCount++;
        }

        // Has the performance check finished?
        if (frameCount >= numberOfFramesToCheck) {
          internal.performanceCheckJob.isComplete = true;
          internal.performanceCheckJob = null;

          console.info('--- PERFORMANCE DIAGNOSTICS ---');
          console.info('maxDeltaTimeFrameCount',maxDeltaTimeFrameCount);
          console.info('frameCount',frameCount);
          console.info('-------------------------------');

          // Did the overall performance test fail?
          if (maxDeltaTimeFrameCount / frameCount > maxRatioOfMaxDeltaTimeFrames) {
            handleLowPerformanceBrowser();
          }
        }
      },
      draw: function () {},
      cancel: function () {},
      init: function () {},
      isComplete: true
    };

    // Run this on the next frame so that some of the setup noise from the current early frame is ignored
    window.hg.util.requestAnimationFrame(function () {
      window.hg.animator.startJob(internal.performanceCheckJob);
    });
  }

  console.log('controller module loaded');
})();

/**
 * This module defines a collection of static general utility functions.
 *
 * @module util
 */
(function () {
  /**
   * Adds an event listener for each of the given events to each of the given elements.
   *
   * @param {Array.<HTMLElement>} elements The elements to add event listeners to.
   * @param {Array.<String>} events The event listeners to add to the elements.
   * @param {Function} callback The single callback for handling the events.
   */
  function listenToMultipleForMultiple(elements, events, callback) {
    elements.forEach(function (element) {
      events.forEach(function (event) {
        util.listen(element, event, callback);
      });
    });
  }

  /**
   * Creates a DOM element with the given tag name, appends it to the given parent element, and
   * gives it the given id and classes.
   *
   * @param {String} tagName The tag name to give the new element.
   * @param {HTMLElement} [parent] The parent element to append the new element to.
   * @param {String} [id] The id to give the new element.
   * @param {Array.<String>} [classes] The classes to give the new element.
   * @returns {HTMLElement} The new element.
   */
  function createElement(tagName, parent, id, classes) {
    var element = document.createElement(tagName);
    if (parent) {
      parent.appendChild(element);
    }
    if (id) {
      element.id = id;
    }
    if (classes) {
      classes.forEach(function (className) {
        addClass(element, className)
      });
    }
    return element;
  }

  /**
   * Determines whether the given element contains the given class.
   *
   * @param {HTMLElement} element The element to check.
   * @param {String} className The class to check for.
   * @returns {Boolean} True if the element does contain the class.
   */
  function containsClass(element, className) {
    var startIndex, indexAfterEnd;
    startIndex = element.className.indexOf(className);
    if (startIndex >= 0) {
      if (startIndex === 0 || element.className[startIndex - 1] === ' ') {
        indexAfterEnd = startIndex + className.length;
        if (indexAfterEnd === element.className.length ||
            element.className[indexAfterEnd] === ' ') {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Toggles whether the given element has the given class. If the enabled argument is given, then
   * the inclusion of the class will be forced. That is, if enabled=true, then this will ensure the
   * element has the class; if enabled=false, then this will ensure the element does NOT have the
   * class; if enabled=undefined, then this will simply toggle whether the element has the class.
   *
   * @param {HTMLElement} element The element to add the class to or remove the class from.
   * @param {String} className The class to add or remove.
   * @param {Boolean} [enabled] If given, then the inclusion of the class will be forced.
   */
  function toggleClass(element, className, enabled) {
    if (typeof enabled === 'undefined') {
      if (containsClass(element, className)) {
        removeClass(element, className);
      } else {
        addClass(element, className);
      }
    } else if (enabled) {
      addClass(element, className);
    } else {
      removeClass(element, className);
    }
  }

  /**
   * Gets the coordinates of the element relative to the top-left corner of the page.
   *
   * @param {HTMLElement} element The element to get the coordinates of.
   * @returns {{x: Number, y: Number}} The coordinates of the element relative to the top-left
   * corner of the page.
   */
  function getPageOffset(element) {
    var x = 0, y = 0;
    while (element) {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent;
    }
    x -= util.getScrollLeft();
    y -= util.getScrollTop();
    return { x: x, y: y };
  }

  /**
   * Gets the dimensions of the viewport.
   *
   * @returns {{w: Number, h: Number}} The dimensions of the viewport.
   */
  function getViewportSize() {
    var w, h;
    if (typeof window.innerWidth !== 'undefined') {
      // Good browsers
      w = window.innerWidth;
      h = window.innerHeight;
    } else if (typeof document.documentElement !== 'undefined' &&
        typeof document.documentElement.clientWidth !== 'undefined' &&
        document.documentElement.clientWidth !== 0) {
      // IE6 in standards compliant mode
      w = document.documentElement.clientWidth;
      h = document.documentElement.clientHeight;
    } else {
      // Older versions of IE
      w = document.getElementsByTagName('body')[0].clientWidth;
      h = document.getElementsByTagName('body')[0].clientHeight;
    }
    return { w: w, h: h };
  }

  /**
   * Removes the given child element from the given parent element if the child does indeed belong
   * to the parent.
   *
   * @param {HTMLElement} parent The parent to remove the child from.
   * @param {HTMLElement} child The child to remove.
   * @returns {Boolean} True if the child did indeed belong to the parent.
   */
  function removeChildIfPresent(parent, child) {
    if (child && child.parentNode === parent) {
      parent.removeChild(child);
      return true;
    }
    return false
  }

  /**
   * Adds the given class to the given element.
   *
   * @param {HTMLElement} element The element to add the class to.
   * @param {String} className The class to add.
   */
  function addClass(element, className) {
    element.setAttribute('class', element.className + ' ' + className);
  }

  /**
   * Removes the given class from the given element.
   *
   * @param {HTMLElement} element The element to remove the class from.
   * @param {String} className The class to remove.
   */
  function removeClass(element, className) {
    element.setAttribute('class', element.className.split(' ').filter(function (value) {
      return value !== className;
    }).join(' '));
  }

  /**
   * Removes all classes from the given element.
   *
   * @param {HTMLElement} element The element to remove all classes from.
   */
  function clearClasses(element) {
    element.className = '';
  }

  /**
   * Calculates the width that the DOM would give to a div with the given text. The given tag
   * name, parent, id, and classes allow the width to be affected by various CSS rules.
   *
   * @param {String} text The text to determine the width of.
   * @param {String} tagName The tag name this text would supposedly have.
   * @param {HTMLElement} [parent] The parent this text would supposedly be a child of; defaults
   * to the document body.
   * @param {String} [id] The id this text would supposedly have.
   * @param {Array.<String>} [classes] The classes this text would supposedly have.
   * @returns {Number} The width of the text under these conditions.
   */
  function getTextWidth(text, tagName, parent, id, classes) {
    var tmpElement, width;
    parent = parent || document.getElementsByTagName('body')[0];
    tmpElement = util.createElement(tagName, null, id, classes);
    tmpElement.style.position = 'absolute';
    tmpElement.style.visibility = 'hidden';
    tmpElement.style.whiteSpace = 'nowrap';
    parent.appendChild(tmpElement);
    tmpElement.innerHTML = text;
    width = tmpElement.clientWidth;
    parent.removeChild(tmpElement);
    return width;
  }

  /**
   * Encodes and concatenates the given URL parameters into a single query string.
   *
   * @param {Object} rawParams An object whose properties represent the URL query string
   * parameters.
   * @return {String} The query string.
   */
  function encodeQueryString(rawParams) {
    var parameter, encodedParams;
    encodedParams = [];
    for (parameter in rawParams) {
      if (rawParams.hasOwnProperty(parameter)) {
        encodedParams.push(encodeURIComponent(parameter) + '=' +
            encodeURIComponent(rawParams[parameter]));
      }
    }
    return '?' + encodedParams.join('&');
  }

  /**
   * Retrieves the value corresponding to the given name from the given query string.
   *
   * (borrowed from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript)
   *
   * @param {String} queryString The query string containing the parameter.
   * @param {String} name The (non-encoded) name of the parameter value to retrieve.
   * @returns {String} The query string parameter value, or null if the parameter was not found.
   */
  function getQueryStringParameterValue(queryString, name) {
    var regex, results;
    name = encodeURIComponent(name);
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    regex = new RegExp('[\\?&]' + name + '=([^&#]*)', 'i');
    results = regex.exec(queryString);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  /**
   * Sets the CSS transition style of the given element.
   *
   * @param {HTMLElement} element The element.
   * @param {Number} value The transition string.
   */
  function setTransition(element, value) {
    element.style.transition = value;
    element.style.WebkitTransition = value;
    element.style.MozTransition = value;
    element.style.msTransition = value;
    element.style.OTransition = value;
  }

  /**
   * Sets the CSS transition duration style of the given element.
   *
   * @param {HTMLElement} element The element.
   * @param {Number} value The duration.
   */
  function setTransitionDurationSeconds(element, value) {
    element.style.transitionDuration = value + 's';
    element.style.WebkitTransitionDuration = value + 's';
    element.style.MozTransitionDuration = value + 's';
    element.style.msTransitionDuration = value + 's';
    element.style.OTransitionDuration = value + 's';
  }

  /**
   * Sets the CSS transition delay style of the given element.
   *
   * @param {HTMLElement} element The element.
   * @param {Number} value The delay.
   */
  function setTransitionDelaySeconds(element, value) {
    element.style.transitionDelay = value + 's';
    element.style.WebkitTransitionDelay = value + 's';
    element.style.MozTransitionDelay = value + 's';
    element.style.msTransitionDelay = value + 's';
    element.style.OTransitionDelay = value + 's';
  }

  /**
   * Sets the userSelect style of the given element to 'none'.
   *
   * @param {HTMLElement} element
   */
  function setUserSelectNone(element) {
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.MozUserSelect = 'none';
    element.style.msUserSelect = 'none';
  }

  /**
   * Removes any children elements from the given parent that have the given class.
   *
   * @param {HTMLElement} parent The parent to remove children from.
   * @param {String} className The class to match.
   */
  function removeChildrenWithClass(parent, className) {
    var matchingChildren, i, count;

    matchingChildren = parent.querySelectorAll('.' + className);

    for (i = 0, count = matchingChildren.length; i < count; i++) {
      parent.removeChild(matchingChildren[i]);
    }
  }

  /**
   * Sets the CSS transition-timing-function style of the given element with the given cubic-
   * bezier points.
   *
   * @param {HTMLElement} element The element.
   * @param {{p1x: Number, p1y: Number, p2x: Number, p2y: Number}} bezierPts The cubic-bezier
   * points to use for this timing function.
   */
  function setTransitionCubicBezierTimingFunction(element, bezierPts) {
    var value = 'cubic-bezier(' + bezierPts.p1x + ',' + bezierPts.p1y + ',' + bezierPts.p2x + ',' +
        bezierPts.p2y + ')';
    element.style.transitionTimingFunction = value;
    element.style.WebkitTransitionTimingFunction = value;
    element.style.MozTransitionTimingFunction = value;
    element.style.msTransitionTimingFunction = value;
    element.style.OTransitionTimingFunction = value;
  }

  // A collection of different types of easing functions.
  var easingFunctions = {
    linear: function (t) {
      return t;
    },
    easeInQuad: function (t) {
      return t * t;
    },
    easeOutQuad: function (t) {
      return t * (2 - t);
    },
    easeInOutQuad: function (t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeInCubic: function (t) {
      return t * t * t;
    },
    easeOutCubic: function (t) {
      return 1 + --t * t * t;
    },
    easeInOutCubic: function (t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    easeInQuart: function (t) {
      return t * t * t * t;
    },
    easeOutQuart: function (t) {
      return 1 - --t * t * t * t;
    },
    easeInOutQuart: function (t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    },
    easeInQuint: function (t) {
      return t * t * t * t * t;
    },
    easeOutQuint: function (t) {
      return 1 + --t * t * t * t * t;
    },
    easeInOutQuint: function (t) {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    }
  };

  // A collection of the inverses of different types of easing functions.
  var inverseEasingFunctions = {
    linear: function (t) {
      return t;
    },
    easeInQuad: function (t) {
      return Math.sqrt(t);
    },
    easeOutQuad: function (t) {
      return 1 - Math.sqrt(1 - t);
    },
    easeInOutQuad: function (t) {
      return t < 0.5 ? Math.sqrt(t * 0.5) : 1 - 0.70710678 * Math.sqrt(1 - t);
    }
  };

  /**
   * A cross-browser compatible requestAnimationFrame. From
   * https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
   *
   * @type {Function}
   */
  var requestAnimationFrame =
      (window.requestAnimationFrame || // the standard
      window.webkitRequestAnimationFrame || // chrome/safari
      window.mozRequestAnimationFrame || // firefox
      window.oRequestAnimationFrame || // opera
      window.msRequestAnimationFrame || // ie
      function (callback) { // default
        window.setTimeout(callback, 16); // 60fps
      }).bind(window);

  /**
   * Calculates the x and y coordinates represented by the given Bezier curve at the given
   * percentage.
   *
   * @param {Number} percent Expressed as a number between 0 and 1.
   * @param {Array.<{x:Number,y:Number}>} controlPoints
   * @returns {{x:Number,y:Number}}
   */
  function getXYFromPercentWithBezier(percent, controlPoints) {
    var x, y, oneMinusPercent, tmp1, tmp2, tmp3, tmp4;

    oneMinusPercent = 1 - percent;
    tmp1 = oneMinusPercent * oneMinusPercent * oneMinusPercent;
    tmp2 = 3 * percent * oneMinusPercent * oneMinusPercent;
    tmp3 = 3 * percent * percent * oneMinusPercent;
    tmp4 = percent * percent * percent;

    x = controlPoints[0].x * tmp1 +
        controlPoints[1].x * tmp2 +
        controlPoints[2].x * tmp3 +
        controlPoints[3].x * tmp4;
    y = controlPoints[0].y * tmp1 +
        controlPoints[1].y * tmp2 +
        controlPoints[2].y * tmp3 +
        controlPoints[3].y * tmp4;

    return {x: x, y: y};
  }

  /**
   * Applies the given transform to the given element as a CSS style in a cross-browser compatible
   * manner.
   *
   * @param {HTMLElement} element
   * @param {String} transform
   */
  function setTransform(element, transform) {
    element.style.webkitTransform = transform;
    element.style.MozTransform = transform;
    element.style.msTransform = transform;
    element.style.OTransform = transform;
    element.style.transform = transform;
  }

  /**
   * Returns a copy of the given array with its contents re-arranged in a random order.
   *
   * The original array is left in its original order.
   *
   * @param {Array} array
   * @returns {Array}
   */
  function shuffle(array) {
    var i, j, count, temp;

    for (i = 0, count = array.length; i < count; i += 1) {
      j = parseInt(Math.random() * count);
      temp = array[j];
      array[j] = array[i];
      array[i] = temp;
    }

    return array;
  }

  /**
   * Return true if the given point would be located within the given polyline if its two ends
   * were connected.
   *
   * If the given boolean is true, then the given polyline is interpreted as being a polygon--i.e.
   * the first and last points are equivalent.
   *
   * This is an implementation of the even-odd rule algorithm.
   *
   * @param {Number} pointX
   * @param {Number} pointY
   * @param {Array.<Number>} coordinates
   * @param {Boolean} isClosed
   */
  function isPointInsidePolyline(pointX, pointY, coordinates, isClosed) {
    var pointIsInside, i, count, p1X, p1Y, p2X, p2Y, previousX, previousY, currentX, currentY;

    pointIsInside = false;

    if (isClosed) {
      // There is no area within a straight line
      if (coordinates.length < 6) {
        return pointIsInside;
      }

      previousX = coordinates[coordinates.length - 4];
      previousY = coordinates[coordinates.length - 3];
    } else {
      // There is no area within a straight line
      if (coordinates.length < 4) {
        return pointIsInside;
      }

      previousX = coordinates[coordinates.length - 2];
      previousY = coordinates[coordinates.length - 1];
    }

    for (i = 0, count = coordinates.length - 2; i < count; i += 2) {
      currentX = coordinates[i];
      currentY = coordinates[i + 1];

      if (currentX > previousX) {
        p1X = previousX;
        p1Y = previousY;
        p2X = currentX;
        p2Y = currentY;
      } else {
        p1X = currentX;
        p1Y = currentY;
        p2X = previousX;
        p2Y = previousY;
      }

      if ((currentX < pointX) === (pointX <= previousX) &&
          (pointY - p1Y) * (p2X - p1X) < (p2Y - p1Y) * (pointX - p1X)) {
        pointIsInside = !pointIsInside;
      }

      previousX = currentX;
      previousY = currentY;
    }

    return pointIsInside;
  }

  /**
   * Performs a shallow copy of the given object.
   *
   * This only copies enumerable properties.
   *
   * @param {Object} object
   * @returns {Object}
   */
  function shallowCopy(object) {
    var key, cloneObject;

    if (typeof object === 'object') {
      cloneObject = {};

      for (key in object) {
        cloneObject[key] = object[key];
      }

      return cloneObject;
    } else {
      return object;
    }
  }

  /**
   * Performs a deep copy of the given object.
   *
   * This only copies enumerable properties.
   *
   * @param {Object} object
   * @returns {Object}
   */
  function deepCopy(object) {
    var key, cloneObject;

    if (typeof object === 'object') {
      // Hack: Not a good/robust copy policy
      if (object instanceof Array) {
        cloneObject = [];
      } else {
        cloneObject = {};
      }

      for (key in object) {
        if (typeof object[key] === 'object') {
          cloneObject[key] = deepCopy(object[key]);
        } else {
          cloneObject[key] = object[key];
        }
      }

      return cloneObject;
    } else {
      return object;
    }
  }

  /**
   * Converts the given HSL color values to HSV color values.
   *
   * @param {{h:Number,s:Number,l:Number}} hsl
   * @returns {{h:Number,s:Number,v:Number}}
   */
  function hslToHsv(hsl) {
    var temp = hsl.s * (hsl.l < 0.5 ? hsl.l : 1 - hsl.l);
    return {
      h: hsl.h,
      s: 2 * temp / (hsl.l + temp),
      v: hsl.l + temp
    };
  }

  /**
   * Converts the given HSV color values to HSL color values.
   *
   * @param {{h:Number,s:Number,v:Number}} hsv
   * @returns {{h:Number,s:Number,l:Number}}
   */
  function hsvToHsl(hsv) {
    var temp = (2 - hsv.s) * hsv.v;
    return {
      h: hsv.h,
      s: hsv.s * hsv.v / (temp < 1 ? temp : 2.00000001 - temp),
      l: temp * 0.5
    };
  }

  /**
   * Checks the given element and all of its ancestors, and returns the first that contains the
   * given class.
   *
   * @param {?HTMLElement} element
   * @param {String} className
   * @returns {?HTMLElement}
   */
  function findClassInSelfOrAncestors(element, className) {
    while (element) {
      if (window.hg.util.containsClass(element, className)) {
        return element;
      }
    }

    return null;
  }

  var utilStyleSheet;

  /**
   * Adds the given style rule to a style sheet for the current document.
   *
   * @param {String} styleRule
   */
  function addRuleToStyleSheet(styleRule) {
    // Create the custom style sheet if it doesn't already exist
    if (!utilStyleSheet) {
      utilStyleSheet = document.createElement('style');
      document.getElementsByTagName('head')[0].appendChild(utilStyleSheet);
    }

    // Add the given rule to the custom style sheet
    if (utilStyleSheet.styleSheet) {
      utilStyleSheet.styleSheet.cssText = styleRule;
    } else {
      utilStyleSheet.appendChild(document.createTextNode(styleRule));
    }
  }

  function checkForSafari() {
    return /Safari/i.test(window.navigator.userAgent) && !/Chrome/i.test(window.navigator.userAgent);
  }

  function checkForIos() {
    return /iPhone|iPod|iPad/i.test(window.navigator.userAgent);
  }

  /**
   * Taken from Underscore.js.
   *
   * Returns a function, that, as long as it continues to be invoked, will not be triggered. The function will be
   * called after it stops being called for N milliseconds. If immediate is passed, trigger the function on the
   * leading edge, instead of the trailing.
   *
   * @param {Function} fn
   * @param {Number} delay
   * @param {Boolean} [immediate]
   * @returns {Function}
   */
  function debounce(fn, delay, immediate) {
    var timeout;

    return function () {
      var context = this;
      var args = arguments;
      var callNow = immediate && !timeout;

      var later = function () {
        timeout = null;
        if (!immediate) {
          fn.apply(context, args);
        }
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, delay);

      if (callNow) {
        fn.apply(context, args);
      }
    };
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module

  /**
   * Exposes the static util functions.
   *
   * @global
   */
  var util = {
    listenToMultipleForMultiple: listenToMultipleForMultiple,
    createElement: createElement,
    containsClass: containsClass,
    toggleClass: toggleClass,
    getPageOffset: getPageOffset,
    getViewportSize: getViewportSize,
    removeChildIfPresent: removeChildIfPresent,
    addClass: addClass,
    removeClass: removeClass,
    clearClasses: clearClasses,
    getTextWidth: getTextWidth,
    encodeQueryString: encodeQueryString,
    getQueryStringParameterValue: getQueryStringParameterValue,
    setTransition: setTransition,
    setTransitionDurationSeconds: setTransitionDurationSeconds,
    setTransitionDelaySeconds: setTransitionDelaySeconds,
    setUserSelectNone: setUserSelectNone,
    removeChildrenWithClass: removeChildrenWithClass,
    setTransitionCubicBezierTimingFunction: setTransitionCubicBezierTimingFunction,
    easingFunctions: easingFunctions,
    inverseEasingFunctions: inverseEasingFunctions,
    requestAnimationFrame: requestAnimationFrame,
    getXYFromPercentWithBezier: getXYFromPercentWithBezier,
    setTransform: setTransform,
    shuffle: shuffle,
    isPointInsidePolyline: isPointInsidePolyline,
    shallowCopy: shallowCopy,
    deepCopy: deepCopy,
    hsvToHsl: hsvToHsl,
    hslToHsv: hslToHsv,
    findClassInSelfOrAncestors: findClassInSelfOrAncestors,
    addRuleToStyleSheet: addRuleToStyleSheet,
    checkForSafari: checkForSafari,
    checkForIos: checkForIos,
    debounce: debounce,
    svgNamespace: 'http://www.w3.org/2000/svg',
    xlinkNamespace: 'http://www.w3.org/1999/xlink'
  };

  // Expose this module
  window.hg = window.hg || {};
  window.hg.util = util;

  console.log('util module loaded');
})();

/**
 * This module defines a singleton for animating things.
 *
 * The animator singleton handles the animation loop for the application and updates all
 * registered AnimationJobs during each animation frame.
 *
 * @module animator
 */
(function () {
  /**
   * @typedef {{start: Function, update: Function(Number, Number), draw: Function, cancel: Function, init: Function, isComplete: Boolean}} AnimationJob
   */

  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var animator = {};
  var config = {};

  config.deltaTimeUpperThreshold = 160;

  // ------------------------------------------------------------------------------------------- //
  // Expose this singleton

  animator.jobs = [];
  animator.previousTime = window.performance && window.performance.now() || 0;
  animator.isLooping = false;
  animator.isPaused = true;
  animator.startJob = startJob;
  animator.cancelJob = cancelJob;
  animator.cancelAll = cancelAll;

  animator.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.animator = animator;

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * This is the animation loop that drives all of the animation.
   *
   * @param {Number} currentTime
   */
  function animationLoop(currentTime) {
    var deltaTime = currentTime - animator.previousTime;
    deltaTime = deltaTime > config.deltaTimeUpperThreshold ?
        config.deltaTimeUpperThreshold : deltaTime;
    animator.isLooping = true;

    if (!animator.isPaused) {
      updateJobs(currentTime, deltaTime);
      drawJobs();
      window.hg.util.requestAnimationFrame(animationLoop);
    } else {
      animator.isLooping = false;
    }

    animator.previousTime = currentTime;
  }

  /**
   * Updates all of the active AnimationJobs.
   *
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function updateJobs(currentTime, deltaTime) {
    var i, count;

    for (i = 0, count = animator.jobs.length; i < count; i += 1) {
      animator.jobs[i].update(currentTime, deltaTime);

      // Remove jobs from the list after they are complete
      if (animator.jobs[i].isComplete) {
        removeJob(animator.jobs[i], i);
        i--;
        count--;
      }
    }
  }

  /**
   * Removes the given job from the collection of active, animating jobs.
   *
   * @param {AnimationJob} job
   * @param {Number} [index]
   */
  function removeJob(job, index) {
    var count;

    if (typeof index === 'number') {
      animator.jobs.splice(index, 1);
    } else {
      for (index = 0, count = animator.jobs.length; index < count; index += 1) {
        if (animator.jobs[index] === job) {
          animator.jobs.splice(index, 1);
          break;
        }
      }
    }

    // Stop the animation loop when there are no more jobs to animate
    if (animator.jobs.length === 0) {
      animator.isPaused = true;
    }
  }

  /**
   * Draws all of the active AnimationJobs.
   */
  function drawJobs() {
    var i, count;

    for (i = 0, count = animator.jobs.length; i < count; i += 1) {
      animator.jobs[i].draw();
    }
  }

  /**
   * Starts the animation loop if it is not already running
   */
  function startAnimationLoop() {
    animator.isPaused = false;

    if (!animator.isLooping) {
      animator.isLooping = true;
      window.hg.util.requestAnimationFrame(firstAnimationLoop);
    }

    // ---  --- //

    /**
     * The time value provided by requestAnimationFrame appears to be the number of milliseconds since the page loaded.
     * However, the rest of the application logic expects time values relative to the Unix epoch. This bootstrapping
     * function helps in translating from the one time frame to the other.
     *
     * @param {Number} currentTime
     */
    function firstAnimationLoop(currentTime) {
      animator.previousTime = currentTime;

      window.hg.util.requestAnimationFrame(animationLoop);
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Public static functions

  /**
   * Starts the given AnimationJob.
   *
   * @param {AnimationJob} job
   */
  function startJob(job) {
    // Is this a restart?
    if (!job.isComplete) {
      console.log('Job restarting: ' + job.constructor.name);

      if (job.refresh) {
        job.refresh();
      } else {
        job.cancel();

        job.init();// TODO: get rid of this init function
        job.start(animator.previousTime);
      }
    } else {
      console.log('Job starting: ' + job.constructor.name);

      job.init();// TODO: get rid of this init function
      job.start(animator.previousTime);
      animator.jobs.push(job);
    }

    startAnimationLoop();
  }

  /**
   * Cancels the given AnimationJob.
   *
   * @param {AnimationJob} job
   */
  function cancelJob(job) {
    console.log('Job cancelling: ' + job.constructor.name);

    job.cancel();
    removeJob(job);
  }

  /**
   * Cancels all running AnimationJobs.
   */
  function cancelAll() {
    while (animator.jobs.length) {
      cancelJob(animator.jobs[0]);
    }
  }

  console.log('animator module loaded');
})();

/**
 * @typedef {AnimationJob} Annotations
 */

/**
 * This module defines a constructor for Annotations objects.
 *
 * Annotations objects creates and modifies visual representations of various aspects of a
 * Grid. This can be very useful for testing purposes.
 *
 * @module Annotations
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.forceLineLengthMultiplier = 4000;
  config.velocityLineLengthMultiplier = 300;

  config.contentTileHue = 187;
  config.contentTileSaturation = 50;
  config.contentTileLightness = 30;

  config.borderTileHue = 267;
  config.borderTileSaturation = 0;
  config.borderTileLightness = 30;

  config.cornerTileHue = 267;
  config.cornerTileSaturation = 50;
  config.cornerTileLightness = 30;

  config.annotations = {
    'tileNeighborConnections': {
      enabled: false,
      create: createTileNeighborConnections,
      destroy: destroyTileNeighborConnections,
      update: updateTileNeighborConnections,
      priority: 1300
    },
    'tileAnchorCenters': {
      enabled: false,
      create: createTileAnchorCenters,
      destroy: destroyTileAnchorCenters,
      update: updateTileAnchorCenters,
      priority: 500
    },
    'transparentTiles': {
      enabled: false,
      create: makeTilesTransparent,
      destroy: makeTilesVisible,
      update: function () {},
      priority: 400
    },
    'tileIndices': {
      enabled: false,
      create: createTileIndices,
      destroy: destroyTileIndices,
      update: updateTileIndices,
      priority: 1000
    },
    'tileForces': {
      enabled: false,
      create: createTileForces,
      destroy: destroyTileForces,
      update: updateTileForces,
      priority: 1100
    },
    'tileVelocities': {
      enabled: false,
      create: createTileVelocities,
      destroy: destroyTileVelocities,
      update: updateTileVelocities,
      priority: 1200
    },
    'sectorColors': {
      enabled: false,
      create: fillSectorColors,
      destroy: function () {},
      update: fillSectorColors,
      priority: 0
    },
    'borderTiles': {
      enabled: false,
      create: fillBorderTiles,
      destroy: function () {},
      update: fillBorderTiles,
      priority: 200
    },
    'contentTiles': {// TODO: remove this?
      enabled: false,
      create: fillContentTiles,
      destroy: function () {},
      update: fillContentTiles,
      priority: 100
    },
    'cornerTiles': {
      enabled: false,
      create: fillCornerTiles,
      destroy: function () {},
      update: fillCornerTiles,
      priority: 300
    },
    'tileParticleCenters': {
      enabled: false,
      create: createTileParticleCenters,
      destroy: destroyTileParticleCenters,
      update: updateTileParticleCenters,
      priority: 600
    },
    'tileDisplacementColors': {
      enabled: false,
      create: createTileDisplacementColors,
      destroy: destroyTileDisplacementColors,
      update: updateTileDisplacementColors,
      priority: 700
    },
    'tileInnerRadii': {
      enabled: false,
      create: createTileInnerRadii,
      destroy: destroyTileInnerRadii,
      update: updateTileInnerRadii,
      priority: 800
    },
    'tileOuterRadii': {
      enabled: false,
      create: createTileOuterRadii,
      destroy: destroyTileOuterRadii,
      update: updateTileOuterRadii,
      priority: 900
    },
    'contentAreaGuidelines': {
      enabled: false,
      create: drawContentAreaGuideLines,
      destroy: removeContentAreaGuideLines,
      update:  function () {},
      priority: 1400
    },
    'lineAnimationGapPoints': {
      enabled: false,
      create: function () {},
      destroy: destroyLineAnimationGapPoints,
      update:  updateLineAnimationGapPoints,
      priority: 1500
    },
    'lineAnimationCornerData': {
      enabled: false,
      create: function () {},
      destroy: destroyLineAnimationCornerConfigurations,
      update:  updateLineAnimationCornerConfigurations,
      priority: 1600
    },
    'panCenterPoints': {
      enabled: false,
      create: createPanCenterPoints,
      destroy: destroyPanCenterPoints,
      update: updatePanCenterPoints,
      priority: 1700
    },
    'sectorAnchorCenters': {
      enabled: false,
      create: createSectorAnchorCenters,
      destroy: destroySectorAnchorCenters,
      update: updateSectorAnchorCenters,
      priority: 1800
    }
  };

  config.annotationsArray = [];

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    config.annotationsArray = Object.keys(config.annotations).map(function (key) {
      return config.annotations[key];
    });

    config.annotationsArray.sort(function comparator(a, b) {
      return a.priority - b.priority;
    });
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @param {Grid} grid
   */
  function Annotations(grid) {
    var annotations = this;

    annotations.grid = grid;
    annotations.startTime = 0;
    annotations.isComplete = true;
    annotations.annotations = window.hg.util.shallowCopy(config.annotations);

    annotations.contentAreaGuideLines = [];
    annotations.tileParticleCenters = [];
    annotations.tileAnchorLines = [];
    annotations.tileAnchorCenters = [];
    annotations.tileDisplacementCircles = [];
    annotations.tileInnerRadii = [];
    annotations.tileOuterRadii = [];
    annotations.neighborLines = [];
    annotations.forceLines = [];
    annotations.velocityLines = [];
    annotations.indexTexts = [];
    annotations.lineAnimationGapDots = [];
    annotations.lineAnimationSelfCornerDots = [];
    annotations.lineAnimationLowerNeighborCornerDots = [];
    annotations.lineAnimationUpperNeighborCornerDots = [];
    annotations.sectorAnchorLines = [];
    annotations.sectorAnchorCenters = [];

    annotations.originalGridCenterDot = null;
    annotations.currentGridCenterDot = null;
    annotations.panCenterDot = null;

    annotations.toggleAnnotationEnabled = toggleAnnotationEnabled;
    annotations.createAnnotations = createAnnotations;
    annotations.destroyAnnotations = destroyAnnotations;
    annotations.setExpandedAnnotations = setExpandedAnnotations;

    annotations.start = start;
    annotations.update = update;
    annotations.draw = draw;
    annotations.cancel = cancel;
    annotations.init = init;
    annotations.refresh = refresh;
  }

  Annotations.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.Annotations = Annotations;

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  // --------------------------------------------------- //
  // Annotation creation functions

  /**
   * Draws content tiles with a different color.
   *
   * @this Annotations
   */
  function fillContentTiles() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.originalTiles.length; i < count; i += 1) {
      if (annotations.grid.originalTiles[i].holdsContent) {
        annotations.grid.originalTiles[i].currentColor.h = config.contentTileHue;
        annotations.grid.originalTiles[i].currentColor.s = config.contentTileSaturation;
        annotations.grid.originalTiles[i].currentColor.l = config.contentTileLightness;
      }
    }
  }

  /**
   * Draws border tiles with a different color.
   *
   * @this Annotations
   */
  function fillBorderTiles() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      if (annotations.grid.allTiles[i].getIsBorderTile()) {
        annotations.grid.allTiles[i].currentColor.h = config.borderTileHue;
        annotations.grid.allTiles[i].currentColor.s = config.borderTileSaturation;
        annotations.grid.allTiles[i].currentColor.l = config.borderTileLightness;
      }
    }
  }

  /**
   * Draws corner tiles with a different color.
   *
   * @this Annotations
   */
  function fillCornerTiles() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.originalBorderTiles.length; i < count; i += 1) {
      if (annotations.grid.originalBorderTiles[i].isCornerTile) {
        annotations.grid.originalTiles[i].currentColor.h = config.cornerTileHue;
        annotations.grid.originalTiles[i].currentColor.s = config.cornerTileSaturation;
        annotations.grid.originalTiles[i].currentColor.l = config.cornerTileLightness;
      }
    }
  }

  /**
   * Draws all of the tiles as transparent.
   *
   * @this Annotations
   */
  function makeTilesTransparent() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.grid.allTiles[i].element.setAttribute('opacity', '0');
    }
  }

  /**
   * Draws vertical guidelines along the left and right sides of the main content area.
   *
   * @this Annotations
   */
  function drawContentAreaGuideLines() {
    var annotations, line;

    annotations = this;
    annotations.contentAreaGuideLines = [];

    line = document.createElementNS(window.hg.util.svgNamespace, 'line');
    annotations.grid.svg.appendChild(line);
    annotations.contentAreaGuideLines[0] = line;

    line.setAttribute('x1', annotations.grid.contentAreaLeft);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', annotations.grid.contentAreaLeft);
    line.setAttribute('y2', annotations.grid.height);
    line.setAttribute('stroke', 'red');
    line.setAttribute('stroke-width', '2');

    line = document.createElementNS(window.hg.util.svgNamespace, 'line');
    annotations.grid.svg.appendChild(line);
    annotations.contentAreaGuideLines[1] = line;

    line.setAttribute('x1', annotations.grid.contentAreaRight);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', annotations.grid.contentAreaRight);
    line.setAttribute('y2', annotations.grid.height);
    line.setAttribute('stroke', 'red');
    line.setAttribute('stroke-width', '2');
  }

  /**
   * Creates a dot at the center of each tile at its current position.
   *
   * @this Annotations
   */
  function createTileParticleCenters() {
    var annotations, i, count;

    annotations = this;
    annotations.tileParticleCenters = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileParticleCenters[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'circle');
      annotations.grid.svg.appendChild(annotations.tileParticleCenters[i]);

      annotations.tileParticleCenters[i].setAttribute('r', '4');
      annotations.tileParticleCenters[i].setAttribute('fill', 'gray');
    }
  }

  /**
   * Creates a dot at the center of each tile at its currentAnchor position.
   *
   * @this Annotations
   */
  function createTileAnchorCenters() {
    var annotations, i, count;

    annotations = this;
    annotations.tileAnchorLines = [];
    annotations.tileAnchorCenters = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileAnchorLines[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'line');
      annotations.grid.svg.appendChild(annotations.tileAnchorLines[i]);

      annotations.tileAnchorLines[i].setAttribute('stroke', '#666666');
      annotations.tileAnchorLines[i].setAttribute('stroke-width', '2');

      annotations.tileAnchorCenters[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'circle');
      annotations.grid.svg.appendChild(annotations.tileAnchorCenters[i]);

      annotations.tileAnchorCenters[i].setAttribute('r', '4');
      annotations.tileAnchorCenters[i].setAttribute('fill', '#888888');
    }
  }

  /**
   * Creates a circle over each tile at its currentAnchor position, which will be used to show colors
   * that indicate its displacement from its original position.
   *
   * @this Annotations
   */
  function createTileDisplacementColors() {
    var annotations, i, count;

    annotations = this;
    annotations.tileDisplacementCircles = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileDisplacementCircles[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'circle');
      annotations.grid.svg.appendChild(annotations.tileDisplacementCircles[i]);

      annotations.tileDisplacementCircles[i].setAttribute('r', '80');
      annotations.tileDisplacementCircles[i].setAttribute('opacity', '0.4');
      annotations.tileDisplacementCircles[i].setAttribute('fill', 'white');
    }
  }

  /**
   * Creates the inner radius of each tile.
   *
   * @this Annotations
   */
  function createTileInnerRadii() {
    var annotations, i, count;

    annotations = this;
    annotations.tileInnerRadii = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileInnerRadii[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'circle');
      annotations.grid.svg.appendChild(annotations.tileInnerRadii[i]);

      annotations.tileInnerRadii[i].setAttribute('stroke', 'blue');
      annotations.tileInnerRadii[i].setAttribute('stroke-width', '1');
      annotations.tileInnerRadii[i].setAttribute('fill', 'transparent');
    }
  }

  /**
   * Creates the outer radius of each tile.
   *
   * @this Annotations
   */
  function createTileOuterRadii() {
    var annotations, i, count;

    annotations = this;
    annotations.tileOuterRadii = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileOuterRadii[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'circle');
      annotations.grid.svg.appendChild(annotations.tileOuterRadii[i]);

      annotations.tileOuterRadii[i].setAttribute('stroke', 'green');
      annotations.tileOuterRadii[i].setAttribute('stroke-width', '1');
      annotations.tileOuterRadii[i].setAttribute('fill', 'transparent');
    }
  }

  /**
   * Creates lines connecting each tile to each of its neighborStates.
   *
   * @this Annotations
   */
  function createTileNeighborConnections() {
    var annotations, i, j, iCount, jCount, tile, neighborStates, neighbor;

    annotations = this;
    annotations.neighborLines = [];

    for (i = 0, iCount = annotations.grid.allTiles.length; i < iCount; i += 1) {
      tile = annotations.grid.allTiles[i];
      neighborStates = tile.getNeighborStates();
      annotations.neighborLines[i] = [];

      for (j = 0, jCount = neighborStates.length; j < jCount; j += 1) {
        neighbor = neighborStates[j];

        if (neighbor) {
          annotations.neighborLines[i][j] =
              document.createElementNS(window.hg.util.svgNamespace, 'line');
          annotations.grid.svg.appendChild(annotations.neighborLines[i][j]);

          annotations.neighborLines[i][j].setAttribute('stroke', 'purple');
          annotations.neighborLines[i][j].setAttribute('stroke-width', '1');
        }
      }
    }
  }

  /**
   * Creates lines representing the cumulative force acting on each tile.
   *
   * @this Annotations
   */
  function createTileForces() {
    var annotations, i, count;

    annotations = this;
    annotations.forceLines = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.forceLines[i] = document.createElementNS(window.hg.util.svgNamespace, 'line');
      annotations.grid.svg.appendChild(annotations.forceLines[i]);

      annotations.forceLines[i].setAttribute('stroke', 'orange');
      annotations.forceLines[i].setAttribute('stroke-width', '2');
    }
  }

  /**
   * Creates lines representing the velocity of each tile.
   *
   * @this Annotations
   */
  function createTileVelocities() {
    var annotations, i, count;

    annotations = this;
    annotations.velocityLines = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.velocityLines[i] = document.createElementNS(window.hg.util.svgNamespace, 'line');
      annotations.grid.svg.appendChild(annotations.velocityLines[i]);

      annotations.velocityLines[i].setAttribute('stroke', 'red');
      annotations.velocityLines[i].setAttribute('stroke-width', '2');
    }
  }

  /**
   * Creates the index of each tile.
   *
   * @this Annotations
   */
  function createTileIndices() {
    var annotations, i, count;

    annotations = this;
    annotations.indexTexts = [];

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.indexTexts[i] = document.createElementNS(window.hg.util.svgNamespace, 'text');
      annotations.indexTexts[i].innerHTML =
          !isNaN(annotations.grid.allTiles[i].originalIndex) ? annotations.grid.allTiles[i].originalIndex : '?';
      annotations.grid.svg.appendChild(annotations.indexTexts[i]);

      annotations.indexTexts[i].setAttribute('font-size', '16');
      annotations.indexTexts[i].setAttribute('fill', 'black');
      annotations.indexTexts[i].setAttribute('pointer-events', 'none');
    }
  }

  /**
   * Draws the tiles of each Sector with a different color.
   *
   * @this Annotations
   */
  function fillSectorColors() {
    var annotations, i, iCount, j, jCount, sector, sectorHue;

    annotations = this;

    for (i = 0, iCount = annotations.grid.sectors.length; i < iCount; i += 1) {
      sector = annotations.grid.sectors[i];
      sectorHue = 60 * i + 20;

      for (j = 0, jCount = sector.tiles.length; j < jCount; j += 1) {
        sector.tiles[j].currentColor.h = sectorHue;
        sector.tiles[j].currentColor.s = window.hg.Grid.config.tileSaturation;
        sector.tiles[j].currentColor.l = window.hg.Grid.config.tileLightness;
      }
    }
  }

  /**
   * Creates a dot at the center of the grid, the center of the viewport, and highlights the base tile for the current
   * pan.
   *
   * @this Annotations
   */
  function createPanCenterPoints() {
    var annotations;

    annotations = this;

    // Current grid center dot
    annotations.currentGridCenterDot = document.createElementNS(window.hg.util.svgNamespace, 'circle');
    annotations.grid.svg.appendChild(annotations.currentGridCenterDot);

    annotations.currentGridCenterDot.setAttribute('r', '8');
    annotations.currentGridCenterDot.setAttribute('fill', 'chartreuse');

    // Current pan center dot
    annotations.panCenterDot = document.createElementNS(window.hg.util.svgNamespace, 'circle');
    annotations.grid.svg.appendChild(annotations.panCenterDot);

    annotations.panCenterDot.setAttribute('r', '5');
    annotations.panCenterDot.setAttribute('fill', 'red');

    // Original grid center dot
    annotations.originalGridCenterDot = document.createElementNS(window.hg.util.svgNamespace, 'circle');
    annotations.grid.svg.appendChild(annotations.originalGridCenterDot);

    annotations.originalGridCenterDot.setAttribute('r', '2');
    annotations.originalGridCenterDot.setAttribute('fill', 'yellow');
  }

  /**
   * Creates a dot at the anchor position of each sector.
   *
   * @this Annotations
   */
  function createSectorAnchorCenters() {
    var annotations, i;

    annotations = this;
    annotations.sectorAnchorLines = [];
    annotations.sectorAnchorCenters = [];

    for (i = 0; i < annotations.grid.sectors.length; i += 1) {
      annotations.sectorAnchorLines[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'line');
      annotations.grid.svg.appendChild(annotations.sectorAnchorLines[i]);

      annotations.sectorAnchorLines[i].setAttribute('stroke', '#999999');
      annotations.sectorAnchorLines[i].setAttribute('stroke-width', '2');

      annotations.sectorAnchorCenters[i] =
          document.createElementNS(window.hg.util.svgNamespace, 'circle');
      annotations.grid.svg.appendChild(annotations.sectorAnchorCenters[i]);

      annotations.sectorAnchorCenters[i].setAttribute('r', '5');
      annotations.sectorAnchorCenters[i].setAttribute('fill', '#BBBBBB');
    }
  }

  // --------------------------------------------------- //
  // Annotation destruction functions

  /**
   * Draws all of the tiles as transparent.
   *
   * @this Annotations
   */
  function makeTilesVisible() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.originalTiles.length; i < count; i += 1) {
      annotations.grid.originalTiles[i].element.setAttribute('opacity', '1');
    }
  }

  /**
   * Draws vertical guidelines along the left and right sides of the main content area.
   *
   * @this Annotations
   */
  function removeContentAreaGuideLines() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.contentAreaGuideLines.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.contentAreaGuideLines[i]);
    }

    annotations.contentAreaGuideLines = [];
  }

  /**
   * Destroys a dot at the center of each tile at its current position.
   *
   * @this Annotations
   */
  function destroyTileParticleCenters() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.tileParticleCenters.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.tileParticleCenters[i]);
    }

    annotations.tileParticleCenters = [];
  }

  /**
   * Destroys a dot at the center of each tile at its currentAnchor position.
   *
   * @this Annotations
   */
  function destroyTileAnchorCenters() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.tileAnchorLines.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.tileAnchorLines[i]);
      annotations.grid.svg.removeChild(annotations.tileAnchorCenters[i]);
    }

    annotations.tileAnchorLines = [];
    annotations.tileAnchorCenters = [];
  }

  /**
   * Destroys a circle over each tile at its currentAnchor position, which will be used to show colors
   * that indicate its displacement from its original position.
   *
   * @this Annotations
   */
  function destroyTileDisplacementColors() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.tileDisplacementCircles.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.tileDisplacementCircles[i]);
    }

    annotations.tileDisplacementCircles = [];
  }

  /**
   * Destroys the inner radius of each tile.
   *
   * @this Annotations
   */
  function destroyTileInnerRadii() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.tileInnerRadii.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.tileInnerRadii[i]);
    }

    annotations.tileInnerRadii = [];
  }

  /**
   * Destroys the outer radius of each tile.
   *
   * @this Annotations
   */
  function destroyTileOuterRadii() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.tileOuterRadii.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.tileOuterRadii[i]);
    }

    annotations.tileOuterRadii = [];
  }

  /**
   * Destroys lines connecting each tile to each of its neighborStates.
   *
   * @this Annotations
   */
  function destroyTileNeighborConnections() {
    var annotations, i, j, iCount, jCount;

    annotations = this;

    for (i = 0, iCount = annotations.neighborLines.length; i < iCount; i += 1) {
      for (j = 0, jCount = annotations.neighborLines[i].length; j < jCount; j += 1) {
        if (annotations.neighborLines[i][j]) {
          annotations.grid.svg.removeChild(annotations.neighborLines[i][j]);
        }
      }
    }

    annotations.neighborLines = [];
  }

  /**
   * Destroys lines representing the cumulative force acting on each tile.
   *
   * @this Annotations
   */
  function destroyTileForces() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.forceLines.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.forceLines[i]);
    }

    annotations.forceLines = [];
  }

  /**
   * Destroys lines representing the velocity of each tile.
   *
   * @this Annotations
   */
  function destroyTileVelocities() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.velocityLines.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.velocityLines[i]);
    }

    annotations.velocityLines = [];
  }

  /**
   * Destroys the index of each tile.
   *
   * @this Annotations
   */
  function destroyTileIndices() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.indexTexts.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.indexTexts[i]);
    }

    annotations.indexTexts = [];
  }

  /**
   * Destroys the dots at the positions of each corner gap point of each line animation.
   *
   * @this Annotations
   */
  function destroyLineAnimationGapPoints() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.lineAnimationGapDots.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.lineAnimationGapDots[i]);
    }

    annotations.lineAnimationGapDots = [];
  }

  /**
   * Destroys annotations describing the corner configurations of each line animation.
   *
   * @this Annotations
   */
  function destroyLineAnimationCornerConfigurations() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.lineAnimationSelfCornerDots.length; i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.lineAnimationSelfCornerDots[i]);
    }

    for (i = 0, count = annotations.lineAnimationLowerNeighborCornerDots.length;
         i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.lineAnimationLowerNeighborCornerDots[i]);
    }

    for (i = 0, count = annotations.lineAnimationUpperNeighborCornerDots.length;
         i < count; i += 1) {
      annotations.grid.svg.removeChild(annotations.lineAnimationUpperNeighborCornerDots[i]);
    }

    annotations.lineAnimationSelfCornerDots = [];
    annotations.lineAnimationLowerNeighborCornerDots = [];
    annotations.lineAnimationUpperNeighborCornerDots = [];
  }

  /**
   * Destroys the dots at the center of the grid and the center of the viewport and stops highlighting the base tile
   * for the current pan.
   *
   * @this Annotations
   */
  function destroyPanCenterPoints() {
    var annotations;

    annotations = this;

    if (annotations.originalGridCenterDot) {
      annotations.grid.svg.removeChild(annotations.originalGridCenterDot);
      annotations.grid.svg.removeChild(annotations.currentGridCenterDot);
      annotations.grid.svg.removeChild(annotations.panCenterDot);

      annotations.originalGridCenterDot = null;
      annotations.currentGridCenterDot = null;
      annotations.panCenterDot = null;
    }
  }

  /**
   * Destroys a dot at the anchor position of each sector.
   *
   * @this Annotations
   */
  function destroySectorAnchorCenters() {
    var annotations, i;

    annotations = this;

    for (i = 0; i < annotations.sectorAnchorLines.length; i += 1) {
      annotations.grid.svg.removeChild(annotations.sectorAnchorLines[i]);
      annotations.grid.svg.removeChild(annotations.sectorAnchorCenters[i]);
    }

    annotations.sectorAnchorLines = [];
    annotations.sectorAnchorCenters = [];
  }

  // --------------------------------------------------- //
  // Annotation updating functions

  /**
   * Updates a dot at the center of each tile at its current position.
   *
   * @this Annotations
   */
  function updateTileParticleCenters() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileParticleCenters[i].setAttribute('cx', annotations.grid.allTiles[i].particle.px);
      annotations.tileParticleCenters[i].setAttribute('cy', annotations.grid.allTiles[i].particle.py);
    }
  }

  /**
   * Updates a dot at the center of each tile at its currentAnchor position.
   *
   * @this Annotations
   */
  function updateTileAnchorCenters() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileAnchorLines[i].setAttribute('x1', annotations.grid.allTiles[i].particle.px);
      annotations.tileAnchorLines[i].setAttribute('y1', annotations.grid.allTiles[i].particle.py);
      annotations.tileAnchorLines[i].setAttribute('x2', annotations.grid.allTiles[i].currentAnchor.x);
      annotations.tileAnchorLines[i].setAttribute('y2', annotations.grid.allTiles[i].currentAnchor.y);
      annotations.tileAnchorCenters[i].setAttribute('cx', annotations.grid.allTiles[i].currentAnchor.x);
      annotations.tileAnchorCenters[i].setAttribute('cy', annotations.grid.allTiles[i].currentAnchor.y);
    }
  }

  /**
   * Updates the color of a circle over each tile at its currentAnchor position according to its
   * displacement from its original position.
   *
   * @this Annotations
   */
  function updateTileDisplacementColors() {
    var annotations, i, count, deltaX, deltaY, angle, distance, colorString;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      deltaX = annotations.grid.allTiles[i].particle.px - annotations.grid.allTiles[i].originalAnchor.x;
      deltaY = annotations.grid.allTiles[i].particle.py - annotations.grid.allTiles[i].originalAnchor.y;

      angle = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
      distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      colorString = 'hsl(' + angle + ',' +
          distance / window.hg.DisplacementWaveJob.config.displacementAmplitude * 100 + '%,80%)';

      annotations.tileDisplacementCircles[i].setAttribute('fill', colorString);
      annotations.tileDisplacementCircles[i]
          .setAttribute('cx', annotations.grid.allTiles[i].particle.px);
      annotations.tileDisplacementCircles[i]
          .setAttribute('cy', annotations.grid.allTiles[i].particle.py);
    }
  }

  /**
   * Updates the inner radius of each tile.
   *
   * @this Annotations
   */
  function updateTileInnerRadii() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileInnerRadii[i].setAttribute('cx', annotations.grid.allTiles[i].particle.px);
      annotations.tileInnerRadii[i].setAttribute('cy', annotations.grid.allTiles[i].particle.py);
      annotations.tileInnerRadii[i].setAttribute('r',
              annotations.grid.allTiles[i].outerRadius * window.hg.Grid.config.sqrtThreeOverTwo);
    }
  }

  /**
   * Updates the outer radius of each tile.
   *
   * @this Annotations
   */
  function updateTileOuterRadii() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.tileOuterRadii[i].setAttribute('cx', annotations.grid.allTiles[i].particle.px);
      annotations.tileOuterRadii[i].setAttribute('cy', annotations.grid.allTiles[i].particle.py);
      annotations.tileOuterRadii[i].setAttribute('r', annotations.grid.allTiles[i].outerRadius);
    }
  }

  /**
   * Updates lines connecting each tile to each of its neighborStates.
   *
   * @this Annotations
   */
  function updateTileNeighborConnections() {
    var annotations, i, j, iCount, jCount, tile, neighborStates, neighbor;

    annotations = this;

    for (i = 0, iCount = annotations.grid.allTiles.length; i < iCount; i += 1) {
      tile = annotations.grid.allTiles[i];
      neighborStates = tile.getNeighborStates();

      for (j = 0, jCount = neighborStates.length; j < jCount; j += 1) {
        neighbor = neighborStates[j];

        if (neighbor) {
          annotations.neighborLines[i][j].setAttribute('x1', tile.particle.px);
          annotations.neighborLines[i][j].setAttribute('y1', tile.particle.py);
          annotations.neighborLines[i][j].setAttribute('x2', neighbor.tile.particle.px);
          annotations.neighborLines[i][j].setAttribute('y2', neighbor.tile.particle.py);
        }
      }
    }
  }

  /**
   * Updates lines representing the cumulative force acting on each tile.
   *
   * @this Annotations
   */
  function updateTileForces() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.forceLines[i].setAttribute('x1', annotations.grid.allTiles[i].particle.px);
      annotations.forceLines[i].setAttribute('y1', annotations.grid.allTiles[i].particle.py);
      annotations.forceLines[i].setAttribute('x2', annotations.grid.allTiles[i].particle.px +
          annotations.grid.allTiles[i].particle.fx * config.forceLineLengthMultiplier);
      annotations.forceLines[i].setAttribute('y2', annotations.grid.allTiles[i].particle.py +
          annotations.grid.allTiles[i].particle.fy * config.forceLineLengthMultiplier);
    }
  }

  /**
   * Updates lines representing the velocity of each tile.
   *
   * @this Annotations
   */
  function updateTileVelocities() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.velocityLines[i].setAttribute('x1', annotations.grid.allTiles[i].particle.px);
      annotations.velocityLines[i].setAttribute('y1', annotations.grid.allTiles[i].particle.py);
      annotations.velocityLines[i].setAttribute('x2', annotations.grid.allTiles[i].particle.px +
          annotations.grid.allTiles[i].particle.vx * config.velocityLineLengthMultiplier);
      annotations.velocityLines[i].setAttribute('y2', annotations.grid.allTiles[i].particle.py +
          annotations.grid.allTiles[i].particle.vy * config.velocityLineLengthMultiplier);
    }
  }

  /**
   * Updates the index of each tile.
   *
   * @this Annotations
   */
  function updateTileIndices() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = annotations.grid.allTiles.length; i < count; i += 1) {
      annotations.indexTexts[i].setAttribute('x', annotations.grid.allTiles[i].particle.px - 10);
      annotations.indexTexts[i].setAttribute('y', annotations.grid.allTiles[i].particle.py + 6);
    }
  }

  /**
   * Draws a dot at the position of each corner gap point of each line animation.
   *
   * @this Annotations
   */
  function updateLineAnimationGapPoints() {
    var annotations, i, iCount, j, jCount, k, line;

    annotations = this;

    destroyLineAnimationGapPoints.call(annotations);
    annotations.lineAnimationGapDots = [];

    for (k = 0, i = 0,
             iCount = window.hg.controller.transientJobs.LineJob.jobs[annotations.grid.index].length;
         i < iCount;
         i += 1) {
      line = window.hg.controller.transientJobs.LineJob.jobs[annotations.grid.index][i];

      for (j = 0, jCount = line.gapPoints.length; j < jCount; j += 1, k += 1) {
        annotations.lineAnimationGapDots[k] =
            document.createElementNS(window.hg.util.svgNamespace, 'circle');
        annotations.lineAnimationGapDots[k].setAttribute('cx', line.gapPoints[j].x);
        annotations.lineAnimationGapDots[k].setAttribute('cy', line.gapPoints[j].y);
        annotations.lineAnimationGapDots[k].setAttribute('r', '4');
        annotations.lineAnimationGapDots[k].setAttribute('fill', 'white');
        annotations.grid.svg.appendChild(annotations.lineAnimationGapDots[k]);
      }
    }
  }

  /**
   * Draws some annotations describing the corner configurations of each line animation.
   *
   * @this Annotations
   */
  function updateLineAnimationCornerConfigurations() {
    var annotations, i, iCount, j, jCount, line, pos, dot;

    annotations = this;

    destroyLineAnimationCornerConfigurations.call(annotations);
    annotations.lineAnimationSelfCornerDots = [];
    annotations.lineAnimationLowerNeighborCornerDots = [];
    annotations.lineAnimationUpperNeighborCornerDots = [];

    for (i = 0, iCount = window.hg.controller.transientJobs.LineJob.jobs[annotations.grid.index].length;
         i < iCount; i += 1) {
      line = window.hg.controller.transientJobs.LineJob.jobs[annotations.grid.index][i];

      for (j = 0, jCount = line.corners.length; j < jCount; j += 1) {
        // Self corner: red dot
        pos = getCornerPosition(line.tiles[j], line.corners[j]);
        dot = document.createElementNS(window.hg.util.svgNamespace, 'circle');
        dot.setAttribute('cx', pos.x);
        dot.setAttribute('cy', pos.y);
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', '#ffaaaa');
        annotations.grid.svg.appendChild(dot);
        annotations.lineAnimationSelfCornerDots.push(dot);

        // Lower neighbor corner: green dot
        if (line.lowerNeighbors[j]) {
          pos = getCornerPosition(line.lowerNeighbors[j].tile, line.lowerNeighborCorners[j]);
          dot = document.createElementNS(window.hg.util.svgNamespace, 'circle');
          dot.setAttribute('cx', pos.x);
          dot.setAttribute('cy', pos.y);
          dot.setAttribute('r', '3');
          dot.setAttribute('fill', '#aaffaa');
          annotations.grid.svg.appendChild(dot);
          annotations.lineAnimationLowerNeighborCornerDots.push(dot);
        }

        // Upper neighbor corner: blue dot
        if (line.upperNeighbors[j]) {
          pos = getCornerPosition(line.upperNeighbors[j].tile, line.upperNeighborCorners[j]);
          dot = document.createElementNS(window.hg.util.svgNamespace, 'circle');
          dot.setAttribute('cx', pos.x);
          dot.setAttribute('cy', pos.y);
          dot.setAttribute('r', '3');
          dot.setAttribute('fill', '#aaaaff');
          annotations.grid.svg.appendChild(dot);
          annotations.lineAnimationUpperNeighborCornerDots.push(dot);
        }
      }
    }

    function getCornerPosition(tile, corner) {
      return {
        x: tile.vertices[corner * 2],
        y: tile.vertices[corner * 2 + 1]
      };
    }
  }

  /**
   * Updates the dots at the center of the grid and the center of the viewport and highlights the base tile for the
   * current pan.
   *
   * @this Annotations
   */
  function updatePanCenterPoints() {
    var annotations, panJob;

    annotations = this;

    if (annotations.originalGridCenterDot) {
      annotations.originalGridCenterDot.setAttribute('cx', annotations.grid.originalCenter.x);
      annotations.originalGridCenterDot.setAttribute('cy', annotations.grid.originalCenter.y);

      annotations.currentGridCenterDot.setAttribute('cx', annotations.grid.currentCenter.x);
      annotations.currentGridCenterDot.setAttribute('cy', annotations.grid.currentCenter.y);

      annotations.panCenterDot.setAttribute('cx', annotations.grid.panCenter.x);
      annotations.panCenterDot.setAttribute('cy', annotations.grid.panCenter.y);

      panJob = window.hg.controller.transientJobs.PanJob.jobs[annotations.grid.index][0];
      if (panJob) {
        panJob.baseTile.currentColor.h = 0;
        panJob.baseTile.currentColor.s = 0;
        panJob.baseTile.currentColor.l = 90;
      }
    }
  }

  /**
   * Updates a dot at the anchor position of each sector.
   *
   * @this Annotations
   */
  function updateSectorAnchorCenters() {
    var annotations, i, expandedAnchorX, expandedAnchorY, collapsedAnchorX, collapsedAnchorY;

    annotations = this;

    for (i = 0; i < annotations.sectorAnchorLines.length; i += 1) {
      expandedAnchorX = annotations.grid.sectors[i].currentAnchor.x;
      expandedAnchorY = annotations.grid.sectors[i].currentAnchor.y;
      collapsedAnchorX = annotations.grid.sectors[i].originalAnchor.x -
          annotations.grid.sectors[i].expandedDisplacement.x;
      collapsedAnchorY = annotations.grid.sectors[i].originalAnchor.y -
          annotations.grid.sectors[i].expandedDisplacement.y;

      annotations.sectorAnchorLines[i].setAttribute('x1', expandedAnchorX);
      annotations.sectorAnchorLines[i].setAttribute('y1', expandedAnchorY);
      annotations.sectorAnchorLines[i].setAttribute('x2', collapsedAnchorX);
      annotations.sectorAnchorLines[i].setAttribute('y2', collapsedAnchorY);
      annotations.sectorAnchorCenters[i].setAttribute('cx', collapsedAnchorX);
      annotations.sectorAnchorCenters[i].setAttribute('cy', collapsedAnchorY);
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Toggles whether the given annotation is enabled.
   *
   * @this Annotations
   * @param {String} annotation
   * @param {Boolean} enabled
   * @throws {Error}
   */
  function toggleAnnotationEnabled(annotation, enabled) {
    var annotations;

    annotations = this;

    annotations.annotations[annotation].enabled = enabled;

    if (enabled) {
      annotations.annotations[annotation].create.call(annotations);
    } else {
      annotations.annotations[annotation].destroy.call(annotations);
    }
  }

  /**
   * Computes spatial parameters of the tile annotations and creates SVG elements to represent
   * these annotations.
   *
   * @this Annotations
   */
  function createAnnotations() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = config.annotationsArray.length; i < count; i += 1) {
      if (config.annotationsArray[i].enabled) {
        config.annotationsArray[i].create.call(annotations);
      }
    }
  }

  /**
   * Destroys the SVG elements used to represent grid annotations.
   *
   * @this Annotations
   */
  function destroyAnnotations() {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = config.annotationsArray.length; i < count; i += 1) {
      config.annotationsArray[i].destroy.call(annotations);
    }
  }

  /**
   * Updates the annotation states to reflect whether the grid is currently expanded.
   *
   * @this Annotations
   * @param {Boolean} isExpanded
   */
  function setExpandedAnnotations(isExpanded) {
    var annotations;

    annotations = this;

    if (annotations.annotations.tileNeighborConnections.enabled) {
      destroyTileNeighborConnections.call(annotations);
      createTileNeighborConnections.call(annotations);
    }
  }

  /**
   * Sets this AnimationJob as started.
   *
   * @this Annotations
   */
  function start() {
    var grid = this;

    grid.isComplete = false;
  }

  /**
   * Updates the animation progress of this AnimationJob to match the given time.
   *
   * @this Annotations
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var annotations, i, count;

    annotations = this;

    for (i = 0, count = config.annotationsArray.length; i < count; i += 1) {
      if (config.annotationsArray[i].enabled) {
        config.annotationsArray[i].update.call(annotations);
      }
    }
  }

  /**
   * Draws the current state of this AnimationJob.
   *
   * @this Annotations
   */
  function draw() {
    // TODO: is there any of the update logic that should instead be handled here?
  }

  /**
   * Stops this AnimationJob, and returns the element to its original form.
   *
   * @this Annotations
   */
  function cancel() {
    var grid = this;

    grid.isComplete = true;
  }

  /**
   * @this Annotations
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  function refresh() {
    var job = this;

    init();

    job.annotations = window.hg.util.shallowCopy(config.annotations);
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  console.log('Annotations module loaded');
})();

/**
* This module defines a constructor for Carousel objects.
*
* Carousel objects display the images and videos for a post.
*
* @module Carousel
*/
(function () {

  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config;

  config = {};

  config.thumbnailHeight = 80;
  config.thumbnailRibbonPadding = 3;
  config.prevNextButtonPadding = 10;
  config.prevNextButtonHeight = 41;
  config.prevNextButtonWidth = 24;

  // ---  --- //

  config.aspectRatio = 16 / 9;

  config.vimeoMetadataBaseUrl = 'http://vimeo.com/api/v2/video';

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    config.thumbnailWidth = config.thumbnailHeight * config.aspectRatio;
  };

  config.computeDependentValues();

  function addChevronDefinition() {
    var body = document.querySelector('body');
    var svg = document.createElementNS(window.hg.util.svgNamespace, 'svg');
    var symbol = document.createElementNS(window.hg.util.svgNamespace, 'symbol');
    var chevron = document.createElementNS(window.hg.util.svgNamespace, 'path');

    body.appendChild(svg);
    svg.appendChild(symbol);
    symbol.appendChild(chevron);

    svg.style.display = 'none';
    symbol.setAttribute('id', 'chevron-left');
    symbol.setAttribute('viewBox', '0 0 247.88 428.75');
    chevron.setAttribute('d', 'M149.03125,428.29625,0.54125,214.36625,149.03125,0.44725l97.959,0.000001-148.49,213.92,148.49,213.92z');
  }

  addChevronDefinition();

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {PagePost} pagePost
   * @param {HTMLElement} parent
   * @param {Array.<String>} images
   * @param {Array.<String>} videos
   * @param {Boolean} [waitToLoadMedia=false]
   */
  function Carousel(grid, pagePost, parent, images, videos, waitToLoadMedia) {
    var carousel = this;

    carousel.grid = grid;
    carousel.pagePost = pagePost;
    carousel.parent = parent;
    carousel.elements = null;
    carousel.currentIndex = 0;
    carousel.previousIndex = 0;
    carousel.mediaMetadata = null;
    carousel.currentIndexPositionRatio = 0;

    carousel.loadMedia = loadMedia;
    carousel.onSlideFinished = onSlideFinished;
    carousel.draw = draw;
    carousel.destroy = destroy;

    createMediaMetadataArray.call(carousel, images, videos);
    createElements.call(carousel, waitToLoadMedia);

    console.log('Carousel created');
  }

  Carousel.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.Carousel = Carousel;

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this Carousel
   * @param {Array.<String>} images
   * @param {Array.<String>} videos
   */
  function createMediaMetadataArray(images, videos) {
    var carousel = this;

    carousel.mediaMetadata = videos.concat(images).map(function (medium) {
      medium.isVideo = !!medium.videoHost;
      return medium;
    });
  }

  /**
   * @this Carousel
   * @param {Boolean} [waitToLoadMedia=false]
   */
  function createElements(waitToLoadMedia) {
    var carousel = this;

    var container = document.createElement('div');
    var slidersContainer = document.createElement('div');
    var mainMediaRibbon = document.createElement('div');
    var thumbnailsRibbon = document.createElement('div');
    var buttonsContainer = document.createElement('div');
    var captionsPanel = document.createElement('div');
    var captionsText = document.createElement('p');
    var previousButtonPanel = document.createElement('div');
    var previousButtonSvg = document.createElementNS(window.hg.util.svgNamespace, 'svg');
    var previousButtonUse = document.createElementNS(window.hg.util.svgNamespace, 'use');
    var nextButtonPanel = document.createElement('div');
    var nextButtonSvg = document.createElementNS(window.hg.util.svgNamespace, 'svg');
    var nextButtonUse = document.createElementNS(window.hg.util.svgNamespace, 'use');

    carousel.parent.appendChild(container);
    container.appendChild(slidersContainer);
    slidersContainer.appendChild(mainMediaRibbon);
    slidersContainer.appendChild(thumbnailsRibbon);
    slidersContainer.appendChild(buttonsContainer);
    buttonsContainer.appendChild(previousButtonPanel);
    previousButtonPanel.appendChild(previousButtonSvg);
    previousButtonSvg.appendChild(previousButtonUse);
    buttonsContainer.appendChild(nextButtonPanel);
    nextButtonPanel.appendChild(nextButtonSvg);
    nextButtonSvg.appendChild(nextButtonUse);
    container.appendChild(captionsPanel);
    captionsPanel.appendChild(captionsText);

    carousel.elements = {};
    carousel.elements.container = container;
    carousel.elements.slidersContainer = slidersContainer;
    carousel.elements.mainMediaRibbon = mainMediaRibbon;
    carousel.elements.thumbnailsRibbon = thumbnailsRibbon;
    carousel.elements.buttonsContainer = buttonsContainer;
    carousel.elements.captionsPanel = captionsPanel;
    carousel.elements.captionsText = captionsText;
    carousel.elements.previousButtonPanel = previousButtonPanel;
    carousel.elements.previousButtonSvg = previousButtonSvg;
    carousel.elements.previousButtonUse = previousButtonUse;
    carousel.elements.nextButtonPanel = nextButtonPanel;
    carousel.elements.nextButtonSvg = nextButtonSvg;
    carousel.elements.nextButtonUse = nextButtonUse;
    carousel.elements.mainMedia = [];
    carousel.elements.thumbnails = [];
    carousel.elements.thumbnailScreens = [];

    container.setAttribute('data-hg-carousel-container', 'data-hg-carousel-container');

    slidersContainer.setAttribute('data-hg-carousel-sliders-container',
      'data-hg-carousel-sliders-container');
    slidersContainer.style.position = 'relative';
    slidersContainer.style.overflow = 'hidden';
    slidersContainer.style.width = '100%';
    window.hg.util.setUserSelectNone(container);

    mainMediaRibbon.style.position = 'relative';
    mainMediaRibbon.style.width = '100%';
    mainMediaRibbon.style.height = '0';
    mainMediaRibbon.style.padding = '56.25% 0 0 0';

    thumbnailsRibbon.style.position = 'relative';
    thumbnailsRibbon.style.width = config.thumbnailWidth * carousel.mediaMetadata.length + 'px';
    thumbnailsRibbon.style.height = config.thumbnailHeight + 'px';
    thumbnailsRibbon.style.left = 'calc(50% - ' + config.thumbnailWidth / 2 + 'px)';
    thumbnailsRibbon.style.paddingTop = config.thumbnailRibbonPadding + 'px';

    buttonsContainer.style.position = 'absolute';
    buttonsContainer.style.top = '0';
    buttonsContainer.style.width = '100%';
    buttonsContainer.style.height = '0';
    buttonsContainer.style.padding = '56.25% 0 0 0';

    previousButtonPanel.setAttribute('data-hg-carousel-button', 'data-hg-carousel-button');
    previousButtonPanel.style.position = 'absolute';
    previousButtonPanel.style.top = '0';
    previousButtonPanel.style.left = '0';
    previousButtonPanel.style.width = 'calc(33.33% - ' + config.prevNextButtonPadding + 'px)';
    previousButtonPanel.style.height = '100%';
    previousButtonPanel.style.cursor = 'pointer';
    previousButtonPanel.addEventListener('click', goToPrevious.bind(carousel), false);

    previousButtonSvg.style.position = 'absolute';
    previousButtonSvg.style.top = '0';
    previousButtonSvg.style.bottom = '0';
    previousButtonSvg.style.left = '0';
    previousButtonSvg.style.margin = 'auto';
    previousButtonSvg.style.height = config.prevNextButtonHeight + 'px';
    previousButtonSvg.style.width = config.prevNextButtonWidth + 'px';
    previousButtonSvg.style.paddingLeft = config.prevNextButtonPadding + 'px';

    previousButtonUse.setAttributeNS(window.hg.util.xlinkNamespace, 'xlink:href', '#chevron-left');

    nextButtonPanel.setAttribute('data-hg-carousel-button', 'data-hg-carousel-button');
    nextButtonPanel.style.position = 'absolute';
    nextButtonPanel.style.top = '0';
    nextButtonPanel.style.right = '0';
    nextButtonPanel.style.width = 'calc(66.67% - ' + config.prevNextButtonPadding + 'px)';
    nextButtonPanel.style.height = '100%';
    nextButtonPanel.style.cursor = 'pointer';
    nextButtonPanel.addEventListener('click', goToNext.bind(carousel), false);

    window.hg.util.setTransform(nextButtonSvg, 'scaleX(-1)');
    nextButtonSvg.style.position = 'absolute';
    nextButtonSvg.style.top = '0';
    nextButtonSvg.style.bottom = '0';
    nextButtonSvg.style.right = '0';
    nextButtonSvg.style.margin = 'auto';
    nextButtonSvg.style.height = config.prevNextButtonHeight + 'px';
    nextButtonSvg.style.width = config.prevNextButtonWidth + 'px';
    nextButtonSvg.style.paddingLeft = config.prevNextButtonPadding + 'px';

    nextButtonUse.setAttributeNS(window.hg.util.xlinkNamespace, 'xlink:href', '#chevron-left');

    captionsPanel.setAttribute('data-hg-captions-panel', 'data-hg-captions-panel');

    captionsText.style.margin = '0';
    captionsText.style.padding = '0';
    carousel.elements.captionsPanel.setAttribute('data-hg-selected', 'data-hg-selected');

    if (!waitToLoadMedia) {
      loadMedia.call(carousel);
    }

    // The Carousel should display differently when it contains zero or one item
    if (carousel.mediaMetadata.length === 0) {
      container.style.display = 'none';
      captionsPanel.style.display = 'none';
    } else {
      // Show the caption for the first media item
      captionsText.innerHTML = carousel.mediaMetadata[0].description;

      if (carousel.mediaMetadata.length === 1) {
        thumbnailsRibbon.style.display = 'none';
      }
    }

    setPrevNextButtonVisibility.call(carousel);
  }

  /**
   * @this Carousel
   */
  function setPrevNextButtonVisibility() {
    var prevVisibility, nextVisibility, panelVisibility;
    var carousel = this;

    // We don't want the prev/next buttons blocking any video controls
    if (!carousel.mediaMetadata.length ||
        carousel.mediaMetadata[carousel.currentIndex].isVideo) {
      prevVisibility = 'hidden';
      nextVisibility = 'hidden';
      panelVisibility = 'hidden';
    } else {
      prevVisibility = carousel.currentIndex > 0 ? 'visible' : 'hidden';
      nextVisibility = carousel.currentIndex < carousel.mediaMetadata.length - 1 ?
        'visible' : 'hidden';
      panelVisibility = 'visible';
    }

    carousel.elements.previousButtonPanel.style.visibility = prevVisibility;
    carousel.elements.nextButtonPanel.style.visibility = nextVisibility;
    carousel.elements.buttonsContainer.style.visibility = panelVisibility;
  }

  /**
   * @this Carousel
   */
  function goToPrevious() {
    var nextIndex;
    var carousel = this;

    if (carousel.currentIndex > 0) {
      nextIndex = (carousel.currentIndex + carousel.mediaMetadata.length - 1) %
        carousel.mediaMetadata.length;
      goToIndex.call(carousel, nextIndex);
    } else {
      console.warn('Carousel cannot go to previous. Already at first medium.');
    }
  }

  /**
   * @this Carousel
   */
  function goToNext() {
    var nextIndex;
    var carousel = this;

    if (carousel.currentIndex < carousel.mediaMetadata.length - 1) {
      nextIndex = (carousel.currentIndex + 1) % carousel.mediaMetadata.length;
      goToIndex.call(carousel, nextIndex);
    } else {
      console.warn('Carousel cannot go to next. Already at last medium.');
    }
  }

  /**
   * @this Carousel
   * @param {Number} nextIndex
   */
  function goToIndex(nextIndex) {
    var carousel = this;

    carousel.previousIndex = carousel.currentIndex;
    carousel.currentIndex = nextIndex;

    window.hg.controller.transientJobs.CarouselImageSlideJob.create(carousel.grid, null, carousel);

    // Pause any playing video
    if (carousel.mediaMetadata[carousel.previousIndex].isVideo) {
      switch (carousel.mediaMetadata[carousel.previousIndex].videoHost) {
        case 'youtube':
          carousel.elements.mainMedia[carousel.previousIndex].querySelector('iframe').contentWindow
            .postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          break;
        case 'vimeo':
          carousel.elements.mainMedia[carousel.previousIndex].querySelector('iframe').contentWindow
            .postMessage('{"method": "pause", "value": ""}', '*');
          break;
        default:
          throw new Error('Invalid video host: ' +
            carousel.mediaMetadata[carousel.previousIndex].videoHost);
      }
    }

    // Hide the caption text
    carousel.elements.captionsPanel.removeAttribute('data-hg-selected');

    // Mark the old thumbnail as un-selected
    carousel.elements.thumbnails[carousel.previousIndex].removeAttribute('data-hg-selected');

    // Mark the current thumbnail as selected
    carousel.elements.thumbnails[carousel.currentIndex].setAttribute('data-hg-selected',
      'data-hg-selected');

    setPrevNextButtonVisibility.call(carousel);
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  // ------------------------------------------------------------------------------------------- //
  // Public static functions

  /**
   * @this Carousel
   */
  function loadMedia() {
    var carousel = this;

    if (carousel.elements.mainMedia.length === 0) {
      carousel.mediaMetadata.forEach(addMedium);
    }

    if (carousel.mediaMetadata.length > 0) {
      // Mark the first thumbnail as selected
      carousel.elements.thumbnails[0].setAttribute('data-hg-selected', 'data-hg-selected');
    }

    // ---  --- //

    function addMedium(mediumMetadatum, index) {
      var mainMediaElement, iframeElement, thumbnailElement, thumbnailScreenElement, thumbnailSrc;

      if (mediumMetadatum.isVideo) {
        iframeElement = document.createElement('iframe');
        iframeElement.setAttribute('src', mediumMetadatum.videoSrc);
        iframeElement.setAttribute('allowfullscreen', 'allowfullscreen');
        iframeElement.setAttribute('frameborder', '0');
        iframeElement.style.position = 'absolute';
        iframeElement.style.top = '0';
        iframeElement.style.width = '100%';
        iframeElement.style.height = '100%';

        mainMediaElement = document.createElement('div');
        mainMediaElement.appendChild(iframeElement);

        switch (mediumMetadatum.videoHost) {
          case 'youtube':
            thumbnailSrc = mediumMetadatum.thumbnailSrc;
            break;
          case 'vimeo':
            thumbnailSrc = '';
            fetchVimeoThumbnail(mediumMetadatum, index);
            break;
          default:
            throw new Error('Invalid video host: ' + mediumMetadatum.videoHost);
        }
      } else {
        mainMediaElement = document.createElement('div');
        mainMediaElement.style.backgroundImage = 'url(' + mediumMetadatum.src + ')';
        mainMediaElement.style.backgroundSize = 'contain';
        mainMediaElement.style.backgroundRepeat = 'no-repeat';
        mainMediaElement.style.backgroundPosition = '50% 50%';

        thumbnailSrc = mediumMetadatum.src;
      }

      mainMediaElement.setAttribute('data-hg-carousel-main-media',
        'data-hg-carousel-main-media');
      mainMediaElement.style.position = 'absolute';
      mainMediaElement.style.top = '0';
      mainMediaElement.style.left = index * 100 + '%';
      mainMediaElement.style.width = '100%';
      mainMediaElement.style.height = '0';
      mainMediaElement.style.padding = '56.25% 0 0 0';

      thumbnailElement = document.createElement('div');
      thumbnailElement.setAttribute('data-hg-carousel-thumbnail',
        'data-hg-carousel-thumbnail');
      thumbnailElement.style.backgroundImage = 'url(' + thumbnailSrc + ')';
      thumbnailElement.style.backgroundSize = 'contain';
      thumbnailElement.style.backgroundRepeat = 'no-repeat';
      thumbnailElement.style.backgroundPosition = '50% 50%';
      thumbnailElement.style.width = config.thumbnailWidth + 'px';
      thumbnailElement.style.height = config.thumbnailHeight + 'px';
      thumbnailElement.style.styleFloat = 'left';
      thumbnailElement.style.cssFloat = 'left';

      thumbnailScreenElement = document.createElement('div');
      thumbnailScreenElement.setAttribute('data-hg-carousel-thumbnail-screen',
        'data-hg-carousel-thumbnail-screen');
      thumbnailScreenElement.style.width = '100%';
      thumbnailScreenElement.style.height = '100%';
      thumbnailScreenElement.style.cursor = 'pointer';
      thumbnailScreenElement.addEventListener('click', goToIndex.bind(carousel, index), false);

      carousel.elements.mainMedia.push(mainMediaElement);
      carousel.elements.thumbnails.push(thumbnailElement);
      carousel.elements.thumbnailScreens.push(thumbnailScreenElement);

      carousel.elements.mainMediaRibbon.appendChild(mainMediaElement);
      carousel.elements.thumbnailsRibbon.appendChild(thumbnailElement);
      thumbnailElement.appendChild(thumbnailScreenElement);

      // ---  --- //

      function fetchVimeoThumbnail(mediumMetadatum, index) {
        var url = config.vimeoMetadataBaseUrl + '/' + mediumMetadatum.id + '.json';
        var xhr = new XMLHttpRequest();

        xhr.addEventListener('load', onLoad, false);
        xhr.addEventListener('error', onError, false);
        xhr.addEventListener('abort', onAbort, false);

        console.log('Sending request for Vimeo metadata to ' + url);

        xhr.open('GET', url, true);
        xhr.send();

        // ---  --- //

        function onLoad() {
          var responseData;

          console.log('Vimeo metadata response status=' + xhr.status +
            ' (' + xhr.statusText + ')');

          try {
            responseData = JSON.parse(xhr.response);
          } catch (error) {
            console.error('Unable to parse Vimeo metadata response body as JSON: ' + xhr.response);
            return;
          }

          mediumMetadatum.thumbnailSrc = responseData[0].thumbnail_large;

          carousel.elements.thumbnails[index].style.backgroundImage =
            'url(' + mediumMetadatum.thumbnailSrc + ')';
        }

        function onError() {
          console.error('An error occurred while loading the Vimeo thumbnail');
        }

        function onAbort() {
          console.error('The Vimeo thumbnail load has been cancelled by the user');
        }
      }
    }
  }

  /**
   * @this Carousel
   */
  function onSlideFinished() {
    var carousel = this;

    // Show the caption for the current media item
    carousel.elements.captionsText.innerHTML =
      carousel.mediaMetadata[carousel.currentIndex].description;
    carousel.elements.captionsPanel.setAttribute('data-hg-selected', 'data-hg-selected');
  }

  /**
   * @this Carousel
   */
  function draw() {
    var carousel = this;

    carousel.elements.mainMediaRibbon.style.left = -carousel.currentIndexPositionRatio * 100 + '%';
    carousel.elements.thumbnailsRibbon.style.left = 'calc(50% - ' + (config.thumbnailWidth / 2 +
      carousel.currentIndexPositionRatio * config.thumbnailWidth) + 'px';
  }

  /**
   * @this Carousel
   */
  function destroy() {
    var carousel = this;

    carousel.parent.removeChild(carousel.elements.container);
    carousel.elements.container = null;
  }

  console.log('Carousel module loaded');
})();

/**
 * @typedef {AnimationJob} Grid
 */

/**
 * @typedef {Object} PostData
 * @property {String} id
 * @property {String} titleShort
 * @property {String} titleLong
 * @property {Array.<String>} urls
 * @property {String} jobTitle
 * @property {String} date
 * @property {Array.<String>} categories
 * @property {Array.<ImageData>} images
 * @property {Array.<VideoData>} videos
 * @property {String} content An extended description of the post in markdown syntax.
 */

/**
 * @typedef {Object} ImageData
 * @property {String} fileName
 * @property {String} description
 */

/**
 * @typedef {Object} VideoData
 * @property {'youtube'|'vimeo'} videoHost
 * @property {String} id
 * @property {String} description
 */

/**
 * This module defines a constructor for Grid objects.
 *
 * Grid objects define a collection of hexagonal tiles that animate and display dynamic,
 * textual content.
 *
 * @module Grid
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  // TODO:
  // - update the tile radius and the targetContentAreaWidth with the screen width?
  //   - what is my plan for mobile devices?

  var config = {};

  config.targetContentAreaWidth = 800;
  config.backgroundHue = 230;
  config.backgroundSaturation = 1;
  config.backgroundLightness = 4;
  config.tileHue = 230;//147;
  config.tileSaturation = 67;
  config.tileLightness = 22;
  config.tileOuterRadius = 80;
  config.tileGap = 12;
  config.contentStartingRowIndex = 2;
  config.firstRowYOffset = config.tileOuterRadius * -0.8;
  config.contentDensity = 0.6;
  config.tileMass = 1;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    config.sqrtThreeOverTwo = Math.sqrt(3) / 2;
    config.twoOverSqrtThree = 2 / Math.sqrt(3);

    config.tileInnerRadius = config.tileOuterRadius * config.sqrtThreeOverTwo;

    config.longGap = config.tileGap * config.twoOverSqrtThree;

    config.tileShortLengthWithGap = config.tileInnerRadius * 2 + config.tileGap;
    config.tileLongLengthWithGap = config.tileOuterRadius * 2 + config.longGap;
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @global
   * @constructor
   * @param {Number} index
   * @param {HTMLElement} parent
   * @param {Array.<PostData>} postData
   * @param {Boolean} [isVertical]
   */
  function Grid(index, parent, postData, isVertical) {
    var grid = this;

    grid.index = index;
    grid.parent = parent;
    grid.postData = postData;
    grid.isVertical = isVertical;

    grid.actualContentAreaWidth = config.targetContentAreaWidth;

    grid.isComplete = true;

    grid.svg = null;
    grid.svgDefs = null;
    grid.originalTiles = [];
    grid.originalBorderTiles = [];
    grid.contentTiles = [];
    grid.originalContentInnerIndices = null;
    grid.innerIndexOfLastContentTile = null;
    grid.originalCenter = null;
    grid.currentCenter = null;
    grid.panCenter = null;
    grid.isPostOpen = false;
    grid.pagePost = null;
    grid.isTransitioning = false;
    grid.expandedTile = null;
    grid.sectors = null;
    grid.allTiles = null;
    grid.allNonContentTiles = null;
    grid.lastExpansionJob = null;
    grid.scrollTop = Number.NaN;

    grid.annotations = new window.hg.Annotations(grid);

    grid.actualContentAreaWidth = Number.NaN;
    grid.rowDeltaY = Number.NaN;
    grid.tileDeltaX = Number.NaN;
    grid.tileNeighborDistance = Number.NaN;
    grid.oddRowTileCount = Number.NaN;
    grid.evenRowTileCount = Number.NaN;
    grid.oddRowXOffset = Number.NaN;
    grid.rowCount = Number.NaN;
    grid.evenRowXOffset = Number.NaN;
    grid.contentAreaLeft = Number.NaN;
    grid.contentAreaRight = Number.NaN;
    grid.oddRowContentStartIndex = Number.NaN;
    grid.evenRowContentStartIndex = Number.NaN;
    grid.oddRowContentTileCount = Number.NaN;
    grid.evenRowContentTileCount = Number.NaN;
    grid.oddRowContentEndIndex = Number.NaN;
    grid.evenRowContentEndIndex = Number.NaN;
    grid.actualContentInnerIndices = Number.NaN;
    grid.innerIndexOfLastContentTile = Number.NaN;
    grid.rowCount = Number.NaN;
    grid.height = Number.NaN;

    grid.resize = resize;
    grid.start = start;
    grid.update = update;
    grid.draw = draw;
    grid.cancel = cancel;
    grid.init = init;

    grid.setBackgroundColor = setBackgroundColor;
    grid.updateTileColor = updateTileColor;
    grid.updateTileMass = updateTileMass;
    grid.setHoveredTile = setHoveredTile;
    grid.createPagePost = createPagePost;
    grid.destroyPagePost = destroyPagePost;
    grid.updateAllTilesCollection = updateAllTilesCollection;
    grid.computeContentIndices = computeContentIndices;

    grid.parent.setAttribute('data-hg-grid-parent', 'data-hg-grid-parent');

    createSvg.call(grid);
    setBackgroundColor.call(grid);
    computeContentIndices.call(grid);
    resize.call(grid);
  }

  Grid.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.Grid = Grid;

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Computes various parameters of the grid. These include:
   *
   * - row count
   * - number of tiles in even and odd rows
   * - the vertical and horizontal displacement between neighbor tiles
   * - the horizontal positions of the first tiles in even and odd rows
   *
   * @this Grid
   */
  function computeGridParameters() {
    var grid, parentHalfWidth, parentHeight, innerContentCount, rowIndex, i, count,
        emptyRowsContentTileCount, minInnerTileCount;

    grid = this;

    parentHalfWidth = grid.parent.clientWidth * 0.5;
    parentHeight = grid.parent.clientHeight;

    grid.originalCenter.x = parentHalfWidth;
    grid.originalCenter.y = parentHeight * 0.5;
    grid.currentCenter.x = grid.originalCenter.x;
    grid.currentCenter.y = grid.originalCenter.y;
    grid.panCenter.x = grid.originalCenter.x;
    grid.panCenter.y = grid.originalCenter.y;

    grid.actualContentAreaWidth = grid.parent.clientWidth < config.targetContentAreaWidth ?
        grid.parent.clientWidth : config.targetContentAreaWidth;

    if (grid.isVertical) {
      grid.rowDeltaY = config.tileOuterRadius * 1.5 + config.tileGap * config.sqrtThreeOverTwo;
      grid.tileDeltaX = config.tileShortLengthWithGap;

      grid.oddRowTileCount = Math.ceil((parentHalfWidth - (config.tileInnerRadius + config.tileGap)) / config.tileShortLengthWithGap) * 2 + 1;
      grid.evenRowTileCount = Math.ceil((parentHalfWidth - (config.tileShortLengthWithGap + config.tileGap * 0.5)) / config.tileShortLengthWithGap) * 2 + 2;

      grid.oddRowXOffset = parentHalfWidth - config.tileShortLengthWithGap * (grid.oddRowTileCount - 1) / 2;

      grid.rowCount = Math.ceil((parentHeight - (config.firstRowYOffset + config.tileOuterRadius * 2 + config.tileGap * Math.sqrt(3))) / grid.rowDeltaY) + 2;
    } else {
      grid.rowDeltaY = config.tileInnerRadius + config.tileGap * 0.5;
      grid.tileDeltaX = config.tileOuterRadius * 3 + config.tileGap * Math.sqrt(3);

      grid.oddRowTileCount = Math.ceil((parentHalfWidth - (grid.tileDeltaX - config.tileOuterRadius)) / grid.tileDeltaX) * 2 + 1;
      grid.evenRowTileCount = Math.ceil((parentHalfWidth - (grid.tileDeltaX + (config.tileGap * config.sqrtThreeOverTwo) + config.tileOuterRadius * 0.5)) / grid.tileDeltaX) * 2 + 2;

      grid.oddRowXOffset = parentHalfWidth - grid.tileDeltaX * (grid.oddRowTileCount - 1) / 2;

      grid.rowCount = Math.ceil((parentHeight - (config.firstRowYOffset + config.tileInnerRadius * 3 + config.tileGap * 2)) / grid.rowDeltaY) + 4;
    }

    grid.evenRowXOffset = grid.oddRowXOffset +
        (grid.evenRowTileCount > grid.oddRowTileCount ? -1 : 1) * grid.tileDeltaX * 0.5;

    // --- Row inner content information --- //

    grid.contentAreaLeft = parentHalfWidth - grid.actualContentAreaWidth * 0.5;
    grid.contentAreaRight = grid.contentAreaLeft + grid.actualContentAreaWidth;

    if (grid.isVertical) {
      grid.oddRowContentStartIndex = Math.ceil((grid.contentAreaLeft - (grid.oddRowXOffset - config.tileInnerRadius)) / grid.tileDeltaX);
      grid.evenRowContentStartIndex = Math.ceil((grid.contentAreaLeft - (grid.evenRowXOffset - config.tileInnerRadius)) / grid.tileDeltaX);
    } else {
      grid.oddRowContentStartIndex = Math.ceil((grid.contentAreaLeft - (grid.oddRowXOffset - config.tileOuterRadius)) / grid.tileDeltaX);
      grid.evenRowContentStartIndex = Math.ceil((grid.contentAreaLeft - (grid.evenRowXOffset - config.tileOuterRadius)) / grid.tileDeltaX);
    }

    grid.oddRowContentTileCount = grid.oddRowTileCount - grid.oddRowContentStartIndex * 2;
    grid.evenRowContentTileCount = grid.evenRowTileCount - grid.evenRowContentStartIndex * 2;

    grid.oddRowContentEndIndex = grid.oddRowContentStartIndex + grid.oddRowContentTileCount - 1;
    grid.evenRowContentEndIndex = grid.evenRowContentStartIndex + grid.evenRowContentTileCount - 1;

    // Update the content inner indices to account for empty rows at the start of the grid
    grid.actualContentInnerIndices = [];
    emptyRowsContentTileCount = Math.ceil(config.contentStartingRowIndex / 2) * grid.oddRowContentTileCount +
        Math.floor(config.contentStartingRowIndex / 2) * grid.evenRowContentTileCount;
    for (i = 0, count = grid.originalContentInnerIndices.length; i < count; i += 1) {
      grid.actualContentInnerIndices[i] = grid.originalContentInnerIndices[i] + emptyRowsContentTileCount;
    }

    grid.innerIndexOfLastContentTile = grid.actualContentInnerIndices[grid.actualContentInnerIndices.length - 1];

    // Add empty rows at the end of the grid
    minInnerTileCount = emptyRowsContentTileCount + grid.innerIndexOfLastContentTile + 1;
    innerContentCount = 0;
    rowIndex = 0;

    while (minInnerTileCount > innerContentCount) {
      innerContentCount += rowIndex % 2 === 0 ?
          grid.oddRowContentTileCount : grid.evenRowContentTileCount;
      rowIndex += 1;
    }

    // Make sure the grid element is tall enough to contain the needed number of rows
    if (rowIndex > grid.rowCount) {
      grid.rowCount = rowIndex + (grid.isVertical ? 0 : 1);
      grid.height = (grid.rowCount - 2) * grid.rowDeltaY;
    } else {
      grid.height = parentHeight;
    }
  }

  /**
   * Calculates the tile indices within the content area column that will represent tiles with
   * content.
   *
   * @this Grid
   */
  function computeContentIndices() {
    var grid, i, j, count, tilesRepresentation;

    grid = this;

    // Use 1s to represent the tiles that hold data
    tilesRepresentation = [];
    count = grid.postData.length;
    for (i = 0; i < count; i += 1) {
      tilesRepresentation[i] = 1;
    }

    // Use 0s to represent the empty tiles
    count = (1 / config.contentDensity) * grid.postData.length;
    for (i = grid.postData.length; i < count; i += 1) {
      tilesRepresentation[i] = 0;
    }

    tilesRepresentation = window.hg.util.shuffle(tilesRepresentation);

    // Record the resulting indices of the elements representing tile content
    grid.originalContentInnerIndices = [];
    for (i = 0, j = 0, count = tilesRepresentation.length; i < count; i += 1) {
      if (tilesRepresentation[i]) {
        grid.originalContentInnerIndices[j++] = i;
      }
    }
  }

  /**
   * Creates the SVG element for the grid.
   *
   * @this Grid
   */
  function createSvg() {
    var grid;

    grid = this;

    grid.svg = document.createElementNS(window.hg.util.svgNamespace, 'svg');
    grid.parent.appendChild(grid.svg);

    grid.svg.style.display = 'block';
    grid.svg.style.position = 'relative';
    grid.svg.style.width = '1px';
    grid.svg.style.height = '1px';
    grid.svg.style.zIndex = '1000';
    grid.svg.style.overflow = 'visible';
    grid.svg.setAttribute('data-hg-svg', 'data-hg-svg');

    grid.svgDefs = document.createElementNS(window.hg.util.svgNamespace, 'defs');
    grid.svg.appendChild(grid.svgDefs);
  }

  /**
   * Creates the tile elements for the grid.
   *
   * @this Grid
   */
  function createTiles() {
    var grid, tileIndex, rowIndex, rowCount, columnIndex, columnCount, anchorX, anchorY,
        isMarginTile, isBorderTile, isCornerTile, isOddRow, contentAreaIndex, postDataIndex,
        defaultNeighborDeltaIndices, tilesNeighborDeltaIndices, oddRowIsLarger, isLargerRow;

    grid = this;

    grid.originalTiles = [];
    grid.originalBorderTiles = [];
    tileIndex = 0;
    contentAreaIndex = 0;
    postDataIndex = 0;
    anchorY = config.firstRowYOffset;
    rowCount = grid.rowCount;
    tilesNeighborDeltaIndices = [];

    defaultNeighborDeltaIndices = getDefaultNeighborDeltaIndices.call(grid);
    oddRowIsLarger = grid.oddRowTileCount > grid.evenRowTileCount;

    for (rowIndex = 0; rowIndex < rowCount; rowIndex += 1, anchorY += grid.rowDeltaY) {
      isOddRow = rowIndex % 2 === 0;
      isLargerRow = oddRowIsLarger && isOddRow || !oddRowIsLarger && !isOddRow;

      if (isOddRow) {
        anchorX = grid.oddRowXOffset;
        columnCount = grid.oddRowTileCount;
      } else {
        anchorX = grid.evenRowXOffset;
        columnCount = grid.evenRowTileCount;
      }

      for (columnIndex = 0; columnIndex < columnCount;
           tileIndex += 1, columnIndex += 1, anchorX += grid.tileDeltaX) {
        isMarginTile = isOddRow ?
            columnIndex < grid.oddRowContentStartIndex ||
                columnIndex > grid.oddRowContentEndIndex :
            columnIndex < grid.evenRowContentStartIndex ||
                columnIndex > grid.evenRowContentEndIndex;

        isBorderTile = grid.isVertical ?
            (columnIndex === 0 || columnIndex === columnCount - 1 ||
              rowIndex === 0 || rowIndex === rowCount - 1) :
            (rowIndex <= 1 || rowIndex >= rowCount - 2 ||
                isLargerRow && (columnIndex === 0 || columnIndex === columnCount - 1));

        isCornerTile = isBorderTile && (grid.isVertical ?
            ((columnIndex === 0 || columnIndex === columnCount - 1) &&
                (rowIndex === 0 || rowIndex === rowCount - 1)) :
            ((rowIndex <= 1 || rowIndex >= rowCount - 2) &&
                (isLargerRow && (columnIndex === 0 || columnIndex === columnCount - 1))));

        grid.originalTiles[tileIndex] = new window.hg.Tile(grid.svg, grid, anchorX, anchorY,
            config.tileOuterRadius, grid.isVertical, config.tileHue, config.tileSaturation,
            config.tileLightness, null, tileIndex, rowIndex, columnIndex, isMarginTile,
            isBorderTile, isCornerTile, isLargerRow, config.tileMass);

        if (isBorderTile) {
          grid.originalBorderTiles.push(grid.originalTiles[tileIndex]);
        }

        // Is the current tile within the content column?
        if (!isMarginTile) {
          // Does the current tile get to hold content?
          if (contentAreaIndex === grid.actualContentInnerIndices[postDataIndex]) {
            grid.originalTiles[tileIndex].setContent(grid.postData[postDataIndex]);
            grid.contentTiles[postDataIndex] = grid.originalTiles[tileIndex];
            postDataIndex += 1;
          }
          contentAreaIndex += 1;
        }

        // Determine the neighbor index offsets for the current tile
        tilesNeighborDeltaIndices[tileIndex] = getNeighborDeltaIndices.call(grid, rowIndex, rowCount,
            columnIndex, columnCount, isLargerRow, defaultNeighborDeltaIndices);
      }
    }

    setNeighborTiles.call(grid, tilesNeighborDeltaIndices);

    updateAllTilesCollection.call(grid, grid.originalTiles);
  }

  /**
   * Connects each tile with references to its neighborStates.
   *
   * @this Grid
   * @param {Array.<Array.<Number>>} tilesNeighborDeltaIndices
   */
  function setNeighborTiles(tilesNeighborDeltaIndices) {
    var grid, i, j, iCount, jCount, neighborTiles;

    grid = this;

    neighborTiles = [];

    // Give each tile references to each of its neighborStates
    for (i = 0, iCount = grid.originalTiles.length; i < iCount; i += 1) {
      // Get the neighborStates around the current tile
      for (j = 0, jCount = 6; j < jCount; j += 1) {
        neighborTiles[j] = !isNaN(tilesNeighborDeltaIndices[i][j]) ?
            grid.originalTiles[i + tilesNeighborDeltaIndices[i][j]] : null;
      }

      grid.originalTiles[i].setNeighborTiles(neighborTiles);
    }
  }

  /**
   * Get the actual neighbor index offsets for the tile described by the given parameters.
   *
   * NaN is used to represent the tile not having a neighbor on that side.
   *
   * @this Grid
   * @param {Number} rowIndex
   * @param {Number} rowCount
   * @param {Number} columnIndex
   * @param {Number} columnCount
   * @param {Boolean} isLargerRow
   * @param {Array.<Number>} defaultNeighborDeltaIndices
   * @returns {Array.<Number>}
   */
  function getNeighborDeltaIndices(rowIndex, rowCount, columnIndex, columnCount, isLargerRow,
                                   defaultNeighborDeltaIndices) {
    var grid, neighborDeltaIndices;

    grid = this;

    neighborDeltaIndices = defaultNeighborDeltaIndices.slice(0);

    // Remove neighbor indices according to the tile's position in the grid
    if (grid.isVertical) {
      // Is this the row with more or fewer tiles?
      if (isLargerRow) {
        // Is this the first column?
        if (columnIndex === 0) {
          neighborDeltaIndices[3] = Number.NaN;
          neighborDeltaIndices[4] = Number.NaN;
          neighborDeltaIndices[5] = Number.NaN;
        }

        // Is this the last column?
        if (columnIndex === columnCount - 1) {
          neighborDeltaIndices[0] = Number.NaN;
          neighborDeltaIndices[1] = Number.NaN;
          neighborDeltaIndices[2] = Number.NaN;
        }
      } else {
        // Is this the first column?
        if (columnIndex === 0) {
          neighborDeltaIndices[4] = Number.NaN;
        }

        // Is this the last column?
        if (columnIndex === columnCount - 1) {
          neighborDeltaIndices[1] = Number.NaN;
        }
      }

      // Is this the first row?
      if (rowIndex === 0) {
        neighborDeltaIndices[0] = Number.NaN;
        neighborDeltaIndices[5] = Number.NaN;
      }

      // Is this the last row?
      if (rowIndex === rowCount - 1) {
        neighborDeltaIndices[2] = Number.NaN;
        neighborDeltaIndices[3] = Number.NaN;
      }
    } else {
      if (isLargerRow) {
        // Is this the first column?
        if (columnIndex === 0) {
          neighborDeltaIndices[4] = Number.NaN;
          neighborDeltaIndices[5] = Number.NaN;
        }

        // Is this the last column?
        if (columnIndex === columnCount - 1) {
          neighborDeltaIndices[1] = Number.NaN;
          neighborDeltaIndices[2] = Number.NaN;
        }
      }

      // Is this the first or second row?
      if (rowIndex ===0) {
        neighborDeltaIndices[0] = Number.NaN;
        neighborDeltaIndices[1] = Number.NaN;
        neighborDeltaIndices[5] = Number.NaN;
      } else if (rowIndex === 1) {
        neighborDeltaIndices[0] = Number.NaN;
      }

      // Is this the last or second-to-last row?
      if (rowIndex === rowCount - 1) {
        neighborDeltaIndices[2] = Number.NaN;
        neighborDeltaIndices[3] = Number.NaN;
        neighborDeltaIndices[4] = Number.NaN;
      } else if (rowIndex === rowCount - 2) {
        neighborDeltaIndices[3] = Number.NaN;
      }
    }

    return neighborDeltaIndices;
  }

  /**
   * Calculates the index offsets of the neighborStates of a tile.
   *
   * @this Grid
   * @returns {Array.<Number>}
   */
  function getDefaultNeighborDeltaIndices() {
    var grid, maxColumnCount, neighborDeltaIndices;

    grid = this;
    neighborDeltaIndices = [];
    maxColumnCount = grid.oddRowTileCount > grid.evenRowTileCount ?
        grid.oddRowTileCount : grid.evenRowTileCount;

    // Neighbor delta indices are dependent on current screen dimensions
    if (grid.isVertical) {
      neighborDeltaIndices[0] = -maxColumnCount + 1; // top-right
      neighborDeltaIndices[1] = 1; // right
      neighborDeltaIndices[2] = maxColumnCount; // bottom-right
      neighborDeltaIndices[3] = maxColumnCount - 1; // bottom-left
      neighborDeltaIndices[4] = -1; // left
      neighborDeltaIndices[5] = -maxColumnCount; // top-left
    } else {
      neighborDeltaIndices[0] = -maxColumnCount * 2 + 1; // top
      neighborDeltaIndices[1] = -maxColumnCount + 1; // top-right
      neighborDeltaIndices[2] = maxColumnCount; // bottom-right
      neighborDeltaIndices[3] = maxColumnCount * 2 - 1; // bottom
      neighborDeltaIndices[4] = maxColumnCount - 1; // bottom-left
      neighborDeltaIndices[5] = -maxColumnCount; // top-left
    }

    return neighborDeltaIndices;
  }

  /**
   * Removes all content from the SVG.
   *
   * @this Grid
   */
  function clearSvg() {
    var grid, svg;

    grid = this;
    svg = grid.svg;

    grid.annotations.destroyAnnotations();

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    grid.svg.appendChild(grid.svgDefs);
  }

  /**
   * Sets an 'data-hg-index' attribute on each tile element to match that tile's current index in this
   * grid's allTiles array.
   *
   * @this Grid
   */
  function setTileIndexAttributes() {
    var grid, i, count;

    grid = this;

    for (i = 0, count = grid.allTiles.length; i < count; i += 1) {
      grid.allTiles[i].element.setAttribute('data-hg-index', i);
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * Prints to the console some information about this grid.
   *
   * This is useful for testing purposes.
   */
  function logGridInfo() {
    var grid = this;

    console.log('// --- Grid Info: ------- //');
    console.log('// - Tile count=' + grid.originalTiles.length);
    console.log('// - Row count=' + grid.rowCount);
    console.log('// - Odd row tile count=' + grid.oddRowTileCount);
    console.log('// - Even row tile count=' + grid.evenRowTileCount);
    console.log('// ------------------------- //');
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Computes spatial parameters of the tiles in this grid.
   *
   * @this Grid
   */
  function resize() {
    var grid;

    grid = this;

    if (grid.allTiles) {
      grid.allTiles.forEach(function (tile) {
        tile.destroy();
      });
    }

    if (grid.isPostOpen) {
      grid.pagePost.destroy();
    }

    grid.originalCenter = {x: Number.NaN, y: Number.NaN};
    grid.currentCenter = {x: Number.NaN, y: Number.NaN};
    grid.panCenter = {x: Number.NaN, y: Number.NaN};
    grid.isPostOpen = false;
    grid.isTransitioning = false;
    grid.expandedTile = null;
    grid.sectors = [];
    grid.allTiles = null;
    grid.allNonContentTiles = null;
    grid.lastExpansionJob = null;
    grid.parent.style.overflowX = 'hidden';
    grid.parent.style.overflowY = 'auto';

    clearSvg.call(grid);
    computeGridParameters.call(grid);

    createTiles.call(grid);

    logGridInfo.call(grid);
  }

  /**
   * Sets the color of this grid's background.
   *
   * @this Grid
   */
  function setBackgroundColor() {
    var grid = this;

    grid.parent.style.backgroundColor = 'hsl(' + config.backgroundHue + ',' +
        config.backgroundSaturation + '%,' + config.backgroundLightness + '%)';
  }

  /**
   * Sets the color of this grid's tiles.
   *
   * @this Grid
   */
  function updateTileColor() {
    var grid, i, count;

    grid = this;

    for (i = 0, count = grid.allNonContentTiles.length; i < count; i += 1) {
      grid.allNonContentTiles[i].setColor(config.tileHue, config.tileSaturation,
          config.tileLightness);
    }
  }

  /**
   * Sets the mass of this grid's tiles.
   *
   * @this Grid
   * @param {Number} mass
   */
  function updateTileMass(mass) {
    var grid, i, count;

    grid = this;

    for (i = 0, count = grid.allTiles.length; i < count; i += 1) {
      grid.allTiles[i].particle.m = mass;
    }
  }

  /**
   * Sets this AnimationJob as started.
   *
   * @this Grid
   */
  function start() {
    var grid = this;

    grid.isComplete = false;
  }

  /**
   * Updates the animation progress of this AnimationJob to match the given time.
   *
   * @this Grid
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var grid, i, count;

    grid = this;

    for (i = 0, count = grid.allTiles.length; i < count; i += 1) {
      grid.allTiles[i].update(currentTime, deltaTime);
    }
  }

  /**
   * Draws the current state of this AnimationJob.
   *
   * @this Grid
   */
  function draw() {
    var grid, i, count;

    grid = this;

    for (i = 0, count = grid.allTiles.length; i < count; i += 1) {
      grid.allTiles[i].draw();
    }

    if (grid.isPostOpen) {
      grid.pagePost.draw();
    }
  }

  /**
   * Stops this AnimationJob, and returns the element to its original form.
   *
   * @this Grid
   */
  function cancel() {
    var grid = this;

    grid.isComplete = true;
  }

  /**
   * Sets the tile that the pointer is currently hovering over.
   *
   * @this Grid
   * @param {Tile} hoveredTile
   */
  function setHoveredTile(hoveredTile) {
    var grid = this;

    if (grid.hoveredTile) {
      grid.hoveredTile.setIsHighlighted(false);
    }

    if (hoveredTile) {
      hoveredTile.setIsHighlighted(true);
    }

    grid.hoveredTile = hoveredTile;
  }

  /**
   * @this Grid
   * @param {Tile} tile
   * @param {{x:Number,y:Number}} startPosition
   * @returns {PagePost}
   */
  function createPagePost(tile, startPosition) {
    var grid = this;

    grid.pagePost = new window.hg.PagePost(tile, startPosition);

    return grid.pagePost;
  }

  /**
   * @this Grid
   */
  function destroyPagePost() {
    var grid = this;

    grid.pagePost.destroy();
    grid.pagePost = null;
  }

  /**
   * Sets the allTiles property to be the given array.
   *
   * @this Grid
   * @param {Array.<Tile>} newTiles
   */
  function updateAllTilesCollection(newTiles) {
    var grid = this;
    var i, count, j;

    grid.allTiles = newTiles;
    grid.allNonContentTiles = [];

    // Create a collection of all of the non-content tiles
    for (j = 0, i = 0, count = newTiles.length; i < count; i += 1) {
      if (!newTiles[i].holdsContent) {
        grid.allNonContentTiles[j++] = newTiles[i];
      }
    }

    // Reset the annotations for the new tile collection
    grid.annotations.destroyAnnotations();
    grid.annotations.createAnnotations();

    setTileIndexAttributes.call(grid);
  }

  /**
   * @this Grid
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  console.log('Grid module loaded');
})();

/**
 * This module defines a constructor for Input objects.
 *
 * Input objects handle the user-input logic for a Grid.
 *
 * @module Input
 */
(function () {

  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.contentTileClickAnimation = 'Radiate Highlight'; // 'Radiate Highlight'|'Radiate Lines'|'Random Line'|'None'
  config.emptyTileClickAnimation = 'Radiate Highlight'; // 'Radiate Highlight'|'Radiate Lines'|'Random Line'|'None'

  config.possibleClickAnimations = {
    'Radiate Highlight': window.hg.controller.transientJobs.HighlightRadiateJob.create,
    'Radiate Lines': window.hg.controller.transientJobs.LinesRadiateJob.create,
    'Random Line': window.hg.controller.transientJobs.LineJob.create,
    'None': function () {}
  };

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   */
  function Input(grid) {
    var input = this;

    input.grid = grid;

    addPointerEventListeners.call(input);
  }

  Input.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.Input = Input;

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Adds event listeners for mouse and touch events for the grid.
   *
   * @this Input
   */
  function addPointerEventListeners() {
    var input;

    input = this;

    document.addEventListener('mouseover', handlePointerOver, false);
    document.addEventListener('mouseout', handlePointerOut, false);
    document.addEventListener('mousemove', handlePointerMove, false);
    document.addEventListener('mousedown', handlePointerDown, false);
    document.addEventListener('mouseup', handlePointerUp, false);
    // TODO: add touch support

    function handlePointerOver(event) {
      var tile;

      if (tile = getTileFromEvent(event)) {

        if (tile.element.getAttribute('data-hg-post-tile')) {
          // TODO: reset the other tile parameters
        }

        input.grid.setHoveredTile(tile);
      }
    }

    function handlePointerOut(event) {
      var tile;

      if (!event.relatedTarget || event.relatedTarget.nodeName === 'HTML') {
        console.log('The mouse left the viewport');

        input.grid.setHoveredTile(null);
      } else if (tile = getTileFromEvent(event)) {

        if (tile.element.getAttribute('data-hg-post-tile')) {
          // TODO: reset the other tile parameters
        }

        input.grid.setHoveredTile(null);

        window.hg.controller.transientJobs.HighlightHoverJob.create(input.grid, tile);

        event.stopPropagation();
      }
    }

    function handlePointerMove(event) {
      if (event.target.getAttribute('data-hg-post-tile')) {
        // TODO:
      } else if (event.target.getAttribute('data-hg-tile')) {
        // TODO:
      }
    }

    function handlePointerDown(event) {
      if (event.target.getAttribute('data-hg-post-tile')) {
        // TODO:
      }
    }

    function handlePointerUp(event) {
      var tile;

      if (event.button === 0 && (tile = getTileFromEvent(event))) {

        if (tile.element.getAttribute('data-hg-post-tile')) {
          // TODO:
        }

        createClickAnimation(input.grid, tile);
      }
    }

    function getTileFromEvent(event) {
      var tileIndex;

      if (event.target.getAttribute('data-hg-tile')) {
        tileIndex = event.target.getAttribute('data-hg-index');
        return input.grid.allTiles[tileIndex];
      } else {
        return null;
      }
    }
  }

  /**
   * @param {Grid} grid
   * @param {Tile} tile
   */
  function createClickAnimation(grid, tile) {
    if (tile.holdsContent) {
      // Trigger an animation for the click
      config.possibleClickAnimations[config.contentTileClickAnimation](grid, tile);

      // Close any open post
      if (grid.isPostOpen) {
        window.hg.controller.transientJobs.ClosePostJob.create(grid, grid.expandedTile);
      }

      // Open the post for the given tile
      window.hg.controller.transientJobs.OpenPostJob.create(grid, tile);
    } else {
      // Trigger an animation for the click
      config.possibleClickAnimations[config.emptyTileClickAnimation](grid, tile);

      // Close any open post
      if (grid.isPostOpen) {
        window.hg.controller.transientJobs.ClosePostJob.create(grid, grid.expandedTile);
      }
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  console.log('Input module loaded');
})();

/**
 * This module defines a constructor for PagePost objects.
 *
 * PagePost objects handle the actual textual contents of the main, enlarged post area.
 *
 * @module PagePost
 */
(function () {

  // TODO: also update the tilepost drawing to utilize the reset job

  // TODO: refactor PagePost, TilePost, and Carousel code

  // TODO: sort post items by date

  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config;

  config = {};

  config.urlLabels = {
    'homepage': 'Homepage',
    'published': 'Published at',
    'demo': 'Demo Site',
    'npm': 'NPM Registry',
    'bower': 'Bower Registry',
    'codepen': 'CodePen',
    'github': 'Repository',
    'googleCode': 'Repository',
    'githubProfile': 'GitHub',
    'linkedin': 'LinkedIn',
    'facebook': 'Facebook',
    'googlePlus': 'Google+',
    'reverbNation': 'Reverb Nation'
  };

  config.monthLabels = {
    1: 'Jan',
    2: 'Feb',
    3: 'Mar',
    4: 'Apr',
    5: 'May',
    6: 'Jun',
    7: 'Jul',
    8: 'Aug',
    9: 'Sep',
    10: 'Oct',
    11: 'Nov',
    12: 'Dec'
  };

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Tile} tile
   * @param {{x:Number,y:Number}} startCenter
   */
  function PagePost(tile, startCenter) {
    var pagePost = this;

    pagePost.tile = tile;
    pagePost.elements = null;
    pagePost.carousel = null;
    pagePost.opacity = 0;
    pagePost.paddingX = Number.NaN;
    pagePost.paddingY = Number.NaN;
    pagePost.halfWidth = Number.NaN;
    pagePost.halfHeight = Number.NaN;
    pagePost.innerWrapperPaddingFromCss = Number.NaN;
    pagePost.center = {
      x: startCenter.x,
      y: startCenter.y
    };

    pagePost.loadCarouselMedia = loadCarouselMedia;
    pagePost.draw = draw;
    pagePost.destroy = destroy;

    createElements.call(pagePost);

    console.log('PagePost created: postId=' + tile.postData.id +
    ', tileIndex=' + tile.originalIndex);
  }

  PagePost.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.PagePost = PagePost;

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this PagePost
   */
  function createElements() {
    var pagePost = this;

    var converter = new showdown.Converter();
    converter.setFlavor('github');

    var horizontalSideLength = window.hg.Grid.config.tileShortLengthWithGap *
        (window.hg.OpenPostJob.config.expandedDisplacementTileCount + 4.25);
    var verticalSideLength = window.hg.Grid.config.longGap *
        (window.hg.OpenPostJob.config.expandedDisplacementTileCount * 2) +
        window.hg.Grid.config.tileOuterRadius *
        (3 * window.hg.OpenPostJob.config.expandedDisplacementTileCount + 2);

    // Adjust post dimensions for smaller openings
    switch (window.hg.OpenPostJob.config.expandedDisplacementTileCount) {
      case 2:
        verticalSideLength += window.hg.Grid.config.tileOuterRadius;
        break;
      case 1:
        verticalSideLength += window.hg.Grid.config.tileOuterRadius * 3;
        horizontalSideLength -= window.hg.Grid.config.tileShortLengthWithGap;
        break;
      case 0:
        verticalSideLength += window.hg.Grid.config.tileOuterRadius * 4;
        horizontalSideLength -= window.hg.Grid.config.tileShortLengthWithGap;
        break;
      default:
        break;
    }

    var horizontalPadding = 1.15 * window.hg.Grid.config.tileShortLengthWithGap;
    var verticalPadding = 2.25 * window.hg.Grid.config.tileOuterRadius;

    var width, height, paddingX, paddingY, gradientColor1String,
      gradientColor2String, innerWrapperPaddingFromCss, innerWrapperVerticalPadding;

    if (pagePost.tile.grid.isVertical) {
      width = horizontalSideLength;
      height = verticalSideLength;
      paddingX = horizontalPadding;
      paddingY = verticalPadding;
    } else {
      width = verticalSideLength;
      height = horizontalSideLength;
      paddingX = verticalPadding;
      paddingY = horizontalPadding;
    }

    width -= paddingX * 2;
    height -= paddingY * 2;

    pagePost.paddingX = paddingX;
    pagePost.paddingY = paddingY;
    pagePost.halfWidth = width / 2;
    pagePost.halfHeight = height / 2;

    gradientColor1String = 'hsl(' +
      window.hg.Grid.config.backgroundHue + ',' +
      window.hg.Grid.config.backgroundSaturation + '%,' +
      window.hg.Grid.config.backgroundLightness + '%)';
    gradientColor2String = 'hsla(' +
      window.hg.Grid.config.backgroundHue + ',' +
      window.hg.Grid.config.backgroundSaturation + '%,' +
      window.hg.Grid.config.backgroundLightness + '%,0)';

    // ---  --- //

    var container = document.createElement('div');
    var outerWrapper = document.createElement('div');
    var innerWrapper = document.createElement('div');
    var title = document.createElement('h1');
    var content = document.createElement('div');
    var logo = document.createElement('div');
    var date = document.createElement('div');
    var urls = document.createElement('div');
    var categories = document.createElement('div');
    var topGradient = document.createElement('div');
    var bottomGradient = document.createElement('div');

    pagePost.tile.grid.parent.appendChild(container);
    container.appendChild(outerWrapper);
    outerWrapper.appendChild(innerWrapper);
    innerWrapper.appendChild(logo);
    innerWrapper.appendChild(date);
    innerWrapper.appendChild(title);
    innerWrapper.appendChild(urls);
    innerWrapper.appendChild(content);
    innerWrapper.appendChild(categories);
    container.appendChild(topGradient);
    container.appendChild(bottomGradient);

    pagePost.elements = [];
    pagePost.elements.container = container;
    pagePost.elements.title = title;
    pagePost.elements.content = content;
    pagePost.elements.logo = logo;
    pagePost.elements.date = date;
    pagePost.elements.urls = urls;
    pagePost.elements.categories = categories;

    container.setAttribute('data-hg-post-container', 'data-hg-post-container');
    container.style.position = 'absolute';
    container.style.width = width + paddingX + 'px';
    container.style.height = height + paddingY * 2 + 'px';
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.overflow = 'hidden';
    container.style.zIndex = window.hg.controller.isSafariBrowser ? '1500' : '500';

    outerWrapper.setAttribute('data-hg-post-outer-wrapper', 'data-hg-post-outer-wrapper');
    outerWrapper.style.width = width + 'px';
    outerWrapper.style.height = height + paddingY * 2 + 'px';
    outerWrapper.style.margin = '0';
    outerWrapper.style.padding = '0 0 0 ' + paddingX + 'px';
    outerWrapper.style.overflow = 'auto';
    outerWrapper.style.webkitOverflowScrolling = 'touch';// This is important for scrolling on mobile devices

    innerWrapper.setAttribute('data-hg-post-inner-wrapper', 'data-hg-post-inner-wrapper');
    innerWrapperPaddingFromCss =
      parseInt(window.getComputedStyle(innerWrapper, null).getPropertyValue('padding-top'));
    innerWrapperVerticalPadding = innerWrapperPaddingFromCss + paddingY;
    innerWrapper.style.padding =
      innerWrapperVerticalPadding + 'px ' + innerWrapperPaddingFromCss + 'px ' +
      innerWrapperVerticalPadding + 'px ' + innerWrapperPaddingFromCss + 'px';
    innerWrapper.style.minHeight = height - innerWrapperPaddingFromCss * 2 + 'px';
    innerWrapper.style.overflowX = 'hidden';

    pagePost.innerWrapperPaddingFromCss = innerWrapperPaddingFromCss;

    title.setAttribute('data-hg-post-title', 'data-hg-post-title');
    title.innerHTML = pagePost.tile.postData.titleLong;

    topGradient.style.position = 'absolute';
    topGradient.style.top = '0';
    topGradient.style.left = paddingX + 'px';
    topGradient.style.height = paddingY + 'px';
    topGradient.style.width = width + 'px';
    topGradient.style.backgroundColor = '#000000';
    topGradient.style.background =
      'linear-gradient(0,' + gradientColor2String + ',' + gradientColor1String + ' 75%)';
    topGradient.style.pointerEvents = 'none';

    bottomGradient.style.position = 'absolute';
    bottomGradient.style.bottom = '0';
    bottomGradient.style.left = paddingX + 'px';
    bottomGradient.style.height = paddingY + 'px';
    bottomGradient.style.width = width + 'px';
    bottomGradient.style.backgroundColor = '#000000';
    bottomGradient.style.background =
      'linear-gradient(0,' + gradientColor1String + ' 25%,' + gradientColor2String + ')';
    bottomGradient.style.pointerEvents = 'none';

    content.setAttribute('data-hg-post-content', 'data-hg-post-content');
    content.innerHTML = converter.makeHtml(pagePost.tile.postData.content);

    logo.setAttribute('data-hg-post-logo', 'data-hg-post-logo');
    logo.style.backgroundImage = 'url(' + pagePost.tile.postData.logoSrc + ')';

    date.setAttribute('data-hg-post-date', 'data-hg-post-date');
    addDate.call(pagePost);

    urls.setAttribute('data-hg-post-urls', 'data-hg-post-urls');
    addUrls.call(pagePost);

    categories.setAttribute('data-hg-post-categories', 'data-hg-post-categories');
    addCategories.call(pagePost);

    // Create the Carousel and insert it before the post's main contents
    pagePost.carousel = new window.hg.Carousel(pagePost.tile.grid, pagePost, innerWrapper,
      pagePost.tile.postData.images, pagePost.tile.postData.videos, true);
    innerWrapper.removeChild(pagePost.carousel.elements.container);
    innerWrapper.insertBefore(pagePost.carousel.elements.container, urls);

    draw.call(pagePost);
  }

  /**
   * @this PagePost
   */
  function addDate() {
    var pagePost = this;
    var dateElement = pagePost.elements.date;
    var dateValue = pagePost.tile.postData.date;

    // Date values can be given as a single string or as an object with a start and end property
    if (typeof dateValue === 'object') {
      dateElement.innerHTML = parseDateString(dateValue.start) + ' &ndash; ' + parseDateString(dateValue.end);
    } else {
      dateElement.innerHTML = parseDateString(dateValue);
    }

    // Hide the date panel if no date was given
    if (!pagePost.tile.postData.date) {
      dateElement.style.display = 'none';
    }

    // ---  --- //

    function parseDateString(dateString) {
      var dateParts;

      if (dateString.toLowerCase() === 'present') {
        return dateString;
      } else {
        dateParts = dateString.split('/');

        switch (dateParts.length) {
          case 1:
            return dateParts[0];
          case 2:
            return config.monthLabels[dateParts[0]] + ' ' + dateParts[1];
          case 3:
            return config.monthLabels[dateParts[0]] + ' ' + dateParts[1] + ', ' + dateParts[2];
          default:
            throw new Error('Invalid date string format: ' + dateString);
        }
      }
    }
  }

  /**
   * @this PagePost
   */
  function addUrls() {
    var pagePost = this;
    var urlsElement = pagePost.elements.urls;
    var urlKeys = Object.keys(pagePost.tile.postData.urls);

    urlKeys.forEach(function (key) {
      addUrl(key, pagePost.tile.postData.urls[key]);
    });

    // Hide the URLs panel if no URLs were given
    if (!urlKeys.length) {
      urlsElement.style.display = 'none';
    }

    // ---  --- //

    function addUrl(key, url) {
      var label, cleanedUrl, paragraphElement, linkElement;

      // Remove the protocol from the URL to make it more human-readable
      cleanedUrl = url.replace(/^.*:\/\//, '');

      label = config.urlLabels[key];

      if (!label) {
        console.warn('Unknown URL type: ' + key);
        label = key;
      }

      // --- Create the elements --- //

      paragraphElement = document.createElement('p');
      linkElement = document.createElement('a');

      paragraphElement.innerHTML = label + ': ';
      paragraphElement.style.overflow = 'hidden';
      paragraphElement.style.whiteSpace = 'nowrap';
      paragraphElement.style.textOverflow = 'ellipsis';

      linkElement.innerHTML = cleanedUrl;
      linkElement.setAttribute('href', url);

      paragraphElement.appendChild(linkElement);
      urlsElement.appendChild(paragraphElement);
    }
  }

  /**
   * @this PagePost
   */
  function addCategories() {
    var pagePost = this;
    var categoriesElement = pagePost.elements.categories;

    pagePost.tile.postData.categories.forEach(addCategoryCard);

    // Hide the categories panel if no categories were given
    if (!pagePost.tile.postData.categories.length) {
      categoriesElement.style.display = 'none';
    }

    // ---  --- //

    function addCategoryCard(category) {
      var categoryCard = document.createElement('span');
      categoriesElement.appendChild(categoryCard);

      categoryCard.setAttribute('data-hg-post-category-card', 'data-hg-post-category-card');
      categoryCard.style.display = 'inline-block';
      categoryCard.innerHTML = category;
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  // ------------------------------------------------------------------------------------------- //
  // Public static functions

  /**
   * @this PagePost
   */
  function loadCarouselMedia() {
    var pagePost = this;

    pagePost.carousel.loadMedia();
  }

  /**
   * @this PagePost
   */
  function draw() {
    var pagePost = this;

    pagePost.elements.container.style.left =
      pagePost.center.x - pagePost.halfWidth - pagePost.paddingX + 'px';
    pagePost.elements.container.style.top =
      pagePost.center.y - pagePost.halfHeight - pagePost.paddingY + 'px';

    pagePost.elements.container.style.opacity = pagePost.opacity;

    pagePost.carousel.draw();
  }

  /**
   * @this PagePost
   */
  function destroy() {
    var pagePost = this;

    pagePost.carousel.destroy();

    pagePost.tile.grid.parent.removeChild(pagePost.elements.container);
    pagePost.elements = null;
  }

  console.log('PagePost module loaded');
})();

/**
 * This module defines a constructor for Sector objects.
 *
 * Sector objects define a collection of hexagonal tiles that lie within a single sector of the
 * grid--outward from a given tile position.
 *
 * Sectors are one-sixth of the grid.
 *
 * Sectors are used to animate open and close a hole in the grid around a given tile, so that the
 * contents of that tile can be shown in an expanded form.
 *
 * @module Sector
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @global
   * @constructor
   * @param {Grid} grid
   * @param {Tile} baseTile
   * @param {Number} sectorIndex
   * @param {Number} expandedDisplacementTileCount
   *
   * PRE-CONDITION: The given baseTile is not a border tile (i.e., it has six neighbors).
   * PRE-CONDITION: The grid is in a closed state.
   *
   * POST-CONDITION: This sector is NOT guaranteed to collect all of the pre-existing tiles in the
   * sector nor to create all of the needed new tiles in the sector (but it probably will).
   */
  function Sector(grid, baseTile, sectorIndex, expandedDisplacementTileCount) {
    var sector = this;

    sector.grid = grid;
    sector.baseTile = baseTile;
    sector.index = sectorIndex;
    sector.expandedDisplacementTileCount = expandedDisplacementTileCount;
    sector.originalAnchor = {x: Number.NaN, y: Number.NaN};
    sector.currentAnchor = {x: Number.NaN, y: Number.NaN};
    sector.majorNeighborDelta = {x: Number.NaN, y: Number.NaN};
    sector.minorNeighborDelta = {x: Number.NaN, y: Number.NaN};
    sector.expandedDisplacement = {x: Number.NaN, y: Number.NaN};
    sector.tiles = null;
    sector.tilesByIndex = null;
    sector.newTiles = null;

    sector.initializeExpandedStateExternalTileNeighbors =
      initializeExpandedStateExternalTileNeighbors;
    sector.destroy = destroy;
    sector.setOriginalPositionForExpansion = setSectorOriginalPositionForExpansion;
    sector.updateCurrentPosition = updateSectorCurrentPosition;

    setUpExpandedDisplacementValues.call(sector);
    setUpTiles.call(sector);
  }

  Sector.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.Sector = Sector;

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Calculates major and minor neighbor values and displacement values for the expanded grid
   * configuration.
   *
   * @this Sector
   */
  function setUpExpandedDisplacementValues() {
    var sector, expansionDirectionNeighborIndex, expansionDirectionNeighborDeltaX,
        expansionDirectionNeighborDeltaY;

    sector = this;

    // Compute which directions to iterate through tiles for this sector

    sector.majorNeighborIndex = sector.index;
    sector.minorNeighborIndex = (sector.index + 1) % 6;

    // Compute the axially-aligned distances between adjacent tiles

    sector.majorNeighborDelta.x =
        sector.baseTile.neighborStates[sector.majorNeighborIndex].tile.originalAnchor.x -
        sector.baseTile.originalAnchor.x;
    sector.majorNeighborDelta.y =
        sector.baseTile.neighborStates[sector.majorNeighborIndex].tile.originalAnchor.y -
        sector.baseTile.originalAnchor.y;
    sector.minorNeighborDelta.x =
        sector.baseTile.neighborStates[sector.minorNeighborIndex].tile.originalAnchor.x -
        sector.baseTile.originalAnchor.x;
    sector.minorNeighborDelta.y =
        sector.baseTile.neighborStates[sector.minorNeighborIndex].tile.originalAnchor.y -
        sector.baseTile.originalAnchor.y;

    // Compute the axially-aligned displacement values of this sector when the grid is expanded

    expansionDirectionNeighborIndex = (sector.index + 5) % 6;

    expansionDirectionNeighborDeltaX =
        sector.baseTile.neighborStates[expansionDirectionNeighborIndex].tile.originalAnchor.x -
        sector.baseTile.originalAnchor.x;
    expansionDirectionNeighborDeltaY =
        sector.baseTile.neighborStates[expansionDirectionNeighborIndex].tile.originalAnchor.y -
        sector.baseTile.originalAnchor.y;

    sector.expandedDisplacement.x =
        sector.expandedDisplacementTileCount * expansionDirectionNeighborDeltaX;
    sector.expandedDisplacement.y =
        sector.expandedDisplacementTileCount * expansionDirectionNeighborDeltaY;

    // Set up the base position values for this overall grid

    sector.originalAnchor.x = sector.baseTile.originalAnchor.x + sector.majorNeighborDelta.x;
    sector.originalAnchor.y = sector.baseTile.originalAnchor.y + sector.majorNeighborDelta.y;
    sector.currentAnchor.x = sector.originalAnchor.x;
    sector.currentAnchor.y = sector.originalAnchor.y;
  }

  /**
   * Populates the collection of tiles that lie within this sector. These include both the
   * pre-existing tiles and new tiles that are created.
   *
   * @this Sector
   */
  function setUpTiles() {
    var sector;

    sector = this;

    sector.tilesByIndex = [];
    sector.newTiles = [];
    sector.tiles = [];

    // Get the old and new tiles for this sector, and set up neighbor states for the expanded grid
    // configuration
    collectOldTilesInSector.call(sector);
    collectNewTilesInSector.call(sector);

    // Re-assign temporary neighbor states for tiles in this sector
    initializeExpandedStateInternalTileNeighbors.call(sector);

    // Convert the two-dimensional array to a flat array
    flattenTileCollection.call(sector);
  }

  /**
   * Collects references to the pre-existing tiles that lie within this sector.
   *
   * PRE-CONDITION: The baseTile is not a border tile (i.e., it has six neighbors).
   *
   * POST-CONDITION: This double-pass major-to-minor line-iteration algorithm is NOT guaranteed to
   * collect all of the tiles in the viewport (but it is likely to) (the breaking edge case is
   * when the viewport's aspect ratio is very large or very small).
   *
   * @this Sector
   */
  function collectOldTilesInSector() {
    var sector;

    sector = this;

    // Collect all of the tiles for this sector into a two-dimensional array
    iterateOverTilesInSectorInMajorOrder();
    iterateOverTilesInSectorInMinorOrder();

    // ---  --- //

    function iterateOverTilesInSectorInMajorOrder() {
      var majorTile, currentTile, majorIndex, minorIndex;

      majorIndex = 0;
      majorTile = sector.baseTile.neighborStates[sector.majorNeighborIndex].tile;

      // Iterate over the major indices of the sector (aka, the "rows" of the sector)
      do {
        currentTile = majorTile;
        minorIndex = 0;

        // Set up the inner array for this "row" of the sector
        sector.tilesByIndex[majorIndex] = sector.tilesByIndex[majorIndex] || [];

        // Iterate over the minor indices of the sector (aka, the "columns" of the sector)
        do {
          // Store the current tile in the "row" if it hasn't already been stored
          if (!sector.tilesByIndex[majorIndex][minorIndex]) {
            addOldTileToSector.call(sector, currentTile, majorIndex, minorIndex);
          }

          minorIndex++;

        } while (currentTile.neighborStates[sector.minorNeighborIndex] &&
            (currentTile = currentTile.neighborStates[sector.minorNeighborIndex].tile));

        majorIndex++;

      } while (majorTile.neighborStates[sector.majorNeighborIndex] &&
          (majorTile = majorTile.neighborStates[sector.majorNeighborIndex].tile));
    }

    function iterateOverTilesInSectorInMinorOrder() {
      var minorTile, currentTile, majorIndex, minorIndex;

      minorIndex = 0;
      minorTile = sector.baseTile.neighborStates[sector.majorNeighborIndex].tile;

      // Iterate over the minor indices of the sector (aka, the "columns" of the sector)
      do {
        currentTile = minorTile;
        majorIndex = 0;

        // Iterate over the major indices of the sector (aka, the "rows" of the sector)
        do {
          // Set up the inner array for this "row" of the sector
          sector.tilesByIndex[majorIndex] = sector.tilesByIndex[majorIndex] || [];

          // Store the current tile in the "column" if it hasn't already been stored
          if (!sector.tilesByIndex[majorIndex][minorIndex]) {
            addOldTileToSector.call(sector, currentTile, majorIndex, minorIndex);
          }

          majorIndex++;

        } while (currentTile.neighborStates[sector.majorNeighborIndex] &&
            (currentTile = currentTile.neighborStates[sector.majorNeighborIndex].tile));

        minorIndex++;

      } while (minorTile.neighborStates[sector.minorNeighborIndex] &&
          (minorTile = minorTile.neighborStates[sector.minorNeighborIndex].tile));
    }
  }

  /**
   * Creates new tiles that will be shown within this sector.
   *
   * PRE-CONDITION: The baseTile is not a border tile (i.e., it has six neighbors).
   *
   * POST-CONDITION: this double-pass major-to-minor line-iteration algorithm is NOT guaranteed to
   * collect all of the tiles in the viewport (but it is likely to) (the breaking edge case is
   * when the viewport's aspect ratio is very large or very small).
   *
   * @this Sector
   */
  function collectNewTilesInSector() {
    var sector, bounds;

    sector = this;

    bounds = computeBounds();

    // Collect all of the tiles for this sector into a two-dimensional array
    iterateOverTilesInSectorInMajorOrder(bounds);
    iterateOverTilesInSectorInMinorOrder(bounds);

    // ---  --- //

    /**
     * This calculates the min and max x and y coordinates for the furthest positions at which we may need to create
     * new tiles.
     *
     * This considers tile positions within the closed grid--i.e., before the sectors have expanded.
     *
     * These extremes are found by the following steps:
     *
     * 1. Calculate a viewport bounding box around the base tile
     * 2. Subtract or add an offset to the bounding box according to the displacement that the sector will undergo
     *
     * @returns {{minX: Number, maxX: Number, minY: Number, maxY: Number}}
     */
    function computeBounds() {
      var minX, maxX, minY, maxY, viewportHalfWidth, viewportHalfHeight;

      // Calculate the dimensions of the viewport with a little extra padding around the edges
      viewportHalfWidth = window.innerWidth / 2 + window.hg.Grid.config.tileLongLengthWithGap;
      viewportHalfHeight = window.innerHeight / 2 + window.hg.Grid.config.tileLongLengthWithGap;

      // Calculate the viewport bounding box around the base tile BEFORE sector expansion has been considered
      minX = sector.baseTile.originalAnchor.x - viewportHalfWidth;
      maxX = sector.baseTile.originalAnchor.x + viewportHalfWidth;
      minY = sector.baseTile.originalAnchor.y - viewportHalfHeight;
      maxY = sector.baseTile.originalAnchor.y + viewportHalfHeight;

      // Add the offset from sector expansion
      minX -= sector.expandedDisplacement.x;
      maxX -= sector.expandedDisplacement.x;
      minY -= sector.expandedDisplacement.y;
      maxY -= sector.expandedDisplacement.y;

      return {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY
      };
    }

    function iterateOverTilesInSectorInMajorOrder(bounds) {
      var startX, startY, anchorX, anchorY, majorIndex, minorIndex;

      startX = sector.baseTile.originalAnchor.x + sector.majorNeighborDelta.x;
      startY = sector.baseTile.originalAnchor.y + sector.majorNeighborDelta.y;

      // Set up the first "column"
      majorIndex = 0;
      minorIndex = 0;
      anchorX = startX;
      anchorY = startY;

      // Iterate over the major indices of the sector (aka, the "rows" of the sector)
      do {
        // Set up the inner array for this "row" of the sector
        sector.tilesByIndex[majorIndex] = sector.tilesByIndex[majorIndex] || [];

        // Iterate over the minor indices of the sector (aka, the "columns" of the sector)
        do {
          // Create a new tile if one did not already exist for this position
          if (!sector.tilesByIndex[majorIndex][minorIndex]) {
            createNewTileInSector.call(sector, majorIndex, minorIndex, anchorX, anchorY);
          }

          // Set up the next "column"
          minorIndex++;
          anchorX += sector.minorNeighborDelta.x;
          anchorY += sector.minorNeighborDelta.y;

        } while (anchorX >= bounds.minX && anchorX <= bounds.maxX && anchorY >= bounds.minY && anchorY <= bounds.maxY);

        // Set up the next "row"
        majorIndex++;
        minorIndex = 0;
        anchorX = startX + majorIndex * sector.majorNeighborDelta.x;
        anchorY = startY + majorIndex * sector.majorNeighborDelta.y;

      } while (anchorX >= bounds.minX && anchorX <= bounds.maxX && anchorY >= bounds.minY && anchorY <= bounds.maxY);
    }

    function iterateOverTilesInSectorInMinorOrder(bounds) {
      var startX, startY, anchorX, anchorY, majorIndex, minorIndex;

      startX = sector.baseTile.originalAnchor.x + sector.majorNeighborDelta.x;
      startY = sector.baseTile.originalAnchor.y + sector.majorNeighborDelta.y;

      // Set up the first "column"
      majorIndex = 0;
      minorIndex = 0;
      anchorX = startX;
      anchorY = startY;

      // Iterate over the minor indices of the sector (aka, the "columns" of the sector)
      do {
        // Iterate over the major indices of the sector (aka, the "rows" of the sector)
        do {
          // Set up the inner array for this "row" of the sector
          sector.tilesByIndex[majorIndex] = sector.tilesByIndex[majorIndex] || [];

          // Create a new tile if one did not already exist for this position
          if (!sector.tilesByIndex[majorIndex][minorIndex]) {
            createNewTileInSector.call(sector, majorIndex, minorIndex, anchorX, anchorY);
          }

          // Set up the next "row"
          majorIndex++;
          anchorX += sector.majorNeighborDelta.x;
          anchorY += sector.majorNeighborDelta.y;

        } while (anchorX >= bounds.minX && anchorX <= bounds.maxX && anchorY >= bounds.minY && anchorY <= bounds.maxY);

        // Set up the next "column"
        majorIndex = 0;
        minorIndex++;
        anchorX = startX + minorIndex * sector.minorNeighborDelta.x;
        anchorY = startY + minorIndex * sector.minorNeighborDelta.y;

      } while (anchorX >= bounds.minX && anchorX <= bounds.maxX && anchorY >= bounds.minY && anchorY <= bounds.maxY);
    }
  }

  /**
   * Adds the given pre-existing tile to this Sector's two-dimensional tile collection.
   *
   * Initializes the tile's expandedState configuration.
   *
   * @this Sector
   * @param {Tile} tile
   * @param {Number} majorIndex
   * @param {Number} minorIndex
   */
  function addOldTileToSector(tile, majorIndex, minorIndex) {
    var sector = this;

    sector.tilesByIndex[majorIndex][minorIndex] = tile;

    window.hg.Tile.initializeTileExpandedState(tile, sector, majorIndex, minorIndex);

    tile.sectorAnchorOffset.x = tile.originalAnchor.x - sector.originalAnchor.x;
    tile.sectorAnchorOffset.y = tile.originalAnchor.y - sector.originalAnchor.y;
  }

  /**
   * Adds a new tile to this Sector's two-dimensional tile collection.
   *
   * Initializes the new tile's expandedState configuration.
   *
   * @this Sector
   * @param {Number} majorIndex
   * @param {Number} minorIndex
   * @param {Number} anchorX
   * @param {Number} anchorY
   */
  function createNewTileInSector(majorIndex, minorIndex, anchorX, anchorY) {
    var sector = this;

    var tile = new window.hg.Tile(sector.grid.svg, sector.grid, anchorX, anchorY,
        window.hg.Grid.config.tileOuterRadius, sector.grid.isVertical, window.hg.Grid.config.tileHue,
        window.hg.Grid.config.tileSaturation, window.hg.Grid.config.tileLightness, null, Number.NaN, Number.NaN,
        Number.NaN, true, false, false, false, window.hg.Grid.config.tileMass);

    addOldTileToSector.call(sector, tile, majorIndex, minorIndex);
    sector.newTiles[sector.newTiles.length] = tile;

    return tile;
  }

  /**
   * Calculates and stores the internal neighbor states for the expanded grid configuration for
   * each tile in this Sector.
   *
   * POST-CONDITION: this does not address external neighbor relations for tiles that lie on the
   * outside edge of this sector.
   *
   * @this Sector
   */
  function initializeExpandedStateInternalTileNeighbors() {
    var sector, majorIndex, minorIndex;

    sector = this;

    // Iterate over the major indices of the sector (aka, the "rows" of the sector)
    for (majorIndex = 0; sector.tilesByIndex[majorIndex]; majorIndex += 1) {

      // Iterate over the minor indices of the sector (aka, the "columns" of the sector)
      for (minorIndex in sector.tilesByIndex[majorIndex]) {
        setTileNeighborStates(sector, majorIndex, parseInt(minorIndex));
      }
    }

    // ---  --- //

    function setTileNeighborStates(sector, majorIndex, minorIndex) {
      var tile, neighborRelationIndex, neighborMajorIndex, neighborMinorIndex;

      tile = sector.tilesByIndex[majorIndex][minorIndex];

      for (neighborRelationIndex = 0; neighborRelationIndex < 6; neighborRelationIndex += 1) {

        // Determine the major and minor indices of the current neighbor
        switch (neighborRelationIndex) {
          case sector.index:
            neighborMajorIndex = majorIndex + 1;
            neighborMinorIndex = minorIndex;
            break;
          case (sector.index + 1) % 6:// TODO: pre-compute these case values
            neighborMajorIndex = majorIndex;
            neighborMinorIndex = minorIndex + 1;
            break;
          case (sector.index + 2) % 6:
            neighborMajorIndex = majorIndex - 1;
            neighborMinorIndex = minorIndex + 1;
            break;
          case (sector.index + 3) % 6:
            neighborMajorIndex = majorIndex - 1;
            neighborMinorIndex = minorIndex;
            break;
          case (sector.index + 4) % 6:
            neighborMajorIndex = majorIndex;
            neighborMinorIndex = minorIndex - 1;
            break;
          case (sector.index + 5) % 6:
            neighborMajorIndex = majorIndex + 1;
            neighborMinorIndex = minorIndex - 1;
            break;
          default:
            throw new Error('Invalid neighborRelationIndex: ' + neighborRelationIndex);
        }

        // Has a tile been created for the neighbor position?
        if (sector.tilesByIndex[neighborMajorIndex] &&
            sector.tilesByIndex[neighborMajorIndex][neighborMinorIndex]) {

          window.hg.Tile.setTileNeighborState(tile, neighborRelationIndex,
              sector.tilesByIndex[neighborMajorIndex][neighborMinorIndex]);
        }
      }
    }
  }

  /**
   * Converts the two-dimensional sector.tilesByIndex array into the flat sector.tiles array.
   *
   * @this Sector
   */
  function flattenTileCollection() {
    var sector, i, majorIndex, minorIndex;

    sector = this;

    i = 0;
    for (majorIndex in sector.tilesByIndex) {
      for (minorIndex in sector.tilesByIndex[majorIndex]) {
        sector.tiles[i++] = sector.tilesByIndex[majorIndex][minorIndex];
      }
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Calculates and stores the external neighbor states for the expanded grid configuration for
   * each tile in this Sector.
   *
   * @this Sector
   * @param {Array.<Sector>} sectors
   */
  function initializeExpandedStateExternalTileNeighbors(sectors) {
    var sector, innerEdgeTiles, neighborTileArrays, i, count, lowerNeighborIndex,
        upperNeighborIndex, innerEdgeNeighborSector, neighborMajorIndex;

    sector = this;

    lowerNeighborIndex = (sector.index + 2) % 6;
    upperNeighborIndex = (sector.index + 3) % 6;

    innerEdgeNeighborSector = sectors[(sector.index + 1) % 6];

    innerEdgeTiles = sector.tilesByIndex[0];
    neighborTileArrays = innerEdgeNeighborSector.tilesByIndex;

    i = sector.expandedDisplacementTileCount;
    neighborMajorIndex = 0;

    // --- Handle the first edge tile --- //

    if (innerEdgeTiles[i]) {
      // The first edge tile with an external neighbor will only have the lower neighbor
      window.hg.Tile.setTileNeighborState(innerEdgeTiles[i], lowerNeighborIndex,
          innerEdgeNeighborSector.tilesByIndex[neighborMajorIndex][0]);
    }

    // --- Handle the middle edge tiles --- //

    for (i += 1, count = innerEdgeTiles.length - 1; i < count; i += 1) {

      // The upper neighbor for the last tile
      window.hg.Tile.setTileNeighborState(innerEdgeTiles[i], upperNeighborIndex,
          innerEdgeNeighborSector.tilesByIndex[neighborMajorIndex][0]);

      neighborMajorIndex += 1;

      // The lower neighbor for the last tile
      window.hg.Tile.setTileNeighborState(innerEdgeTiles[i], lowerNeighborIndex,
          innerEdgeNeighborSector.tilesByIndex[neighborMajorIndex][0]);
    }

    // --- Handle the last edge tile --- //

    if (innerEdgeTiles[i]) {
      // The upper neighbor for the last tile
      window.hg.Tile.setTileNeighborState(innerEdgeTiles[i], upperNeighborIndex,
          innerEdgeNeighborSector.tilesByIndex[neighborMajorIndex][0]);

      neighborMajorIndex += 1;

      // The last edge tile with an external neighbor might not have the lower neighbor
      if (innerEdgeNeighborSector.tilesByIndex[neighborMajorIndex] &&
          innerEdgeNeighborSector.tilesByIndex[neighborMajorIndex][0]) {
        window.hg.Tile.setTileNeighborState(innerEdgeTiles[i], lowerNeighborIndex,
            innerEdgeNeighborSector.tilesByIndex[neighborMajorIndex][0]);
      }
    }

    // --- Mark the inner edge tiles as border tiles --- //

    // If the dimensions of the expanded post area are larger than that of the viewport, then we cannot simply use the
    // number of tiles along a side of this area
    count = sector.expandedDisplacementTileCount + 1;
    count = innerEdgeTiles.length < count ? innerEdgeTiles.length : count;

    for (i = 0; i < count; i += 1) {
      innerEdgeTiles[i].expandedState.isBorderTile = true;
    }

    // --- Mark the outer edge tiles as border tiles --- //

    i = innerEdgeTiles.length - 1 - sector.expandedDisplacementTileCount;
    i = i < 0 ? 0 : i;

    for (count = neighborTileArrays.length; i < count; i += 1) {
      if (neighborTileArrays[i][0]) {
        neighborTileArrays[i][0].expandedState.isBorderTile = true;
      }
    }

    // --- Mark the outermost sector tiles as border tiles --- //
    for (i = 0, count = sector.tilesByIndex.length; i < count; i += 1) {
      if (sector.tilesByIndex[i].length) {
        sector.tilesByIndex[i][sector.tilesByIndex[i].length - 1].expandedState.isBorderTile = true;
      }
    }
  }

  /**
   * Frees up memory used by this Sector.
   *
   * @this Sector
   * @param {Boolean} alsoDestroyOriginalTileExpandedState
   */
  function destroy(alsoDestroyOriginalTileExpandedState) {
    var sector, i, count;

    sector = this;

    if (alsoDestroyOriginalTileExpandedState) {
      for (i = 0, count = sector.tiles.length; i < count; i += 1) {
        sector.tiles[i].expandedState = null;
      }
    }

    for (i = 0, count = sector.newTiles.length; i < count; i += 1) {
      sector.newTiles[i].neighborStates = null;
      sector.newTiles[i].destroy();
    }
  }

  /**
   * Updates the base position of this Sector and the positions of all of its Tiles.
   *
   * @this Sector
   * @param {Boolean} isExpanded
   */
  function setSectorOriginalPositionForExpansion(isExpanded) {
    var sector, i, count, dx, dy;

    sector = this;

    if (isExpanded) {
      dx = sector.expandedDisplacement.x;
      dy = sector.expandedDisplacement.y;
    } else {
      dx = -sector.expandedDisplacement.x;
      dy = -sector.expandedDisplacement.y;
    }

    sector.originalAnchor.x += dx;
    sector.originalAnchor.y += dy;

    for (i = 0, count = sector.tiles.length; i < count; i += 1) {
      sector.tiles[i].originalAnchor.x += dx;
      sector.tiles[i].originalAnchor.y += dy;
    }
  }

  /**
   * Updates the current position of this Sector and the positions of all of its Tiles.
   *
   * @this Sector
   * @param {Number} dx
   * @param {Number} dy
   */
  function updateSectorCurrentPosition(dx, dy) {
    var sector, i, count;

    sector = this;

    sector.currentAnchor.x = sector.originalAnchor.x + dx;
    sector.currentAnchor.y = sector.originalAnchor.y + dy;

    for (i = 0, count = sector.tiles.length; i < count; i += 1) {
      sector.tiles[i].currentAnchor.x += dx;
      sector.tiles[i].currentAnchor.y += dy;
    }
  }

  console.log('Sector module loaded');
})();

/**
 * This module defines a constructor for Tile objects.
 *
 * Tile objects handle the particle logic and the hexagon SVG-shape logic for a single
 * hexagonal tile within a Grid.
 *
 * @module Tile
 */
(function () {
  /**
   * @typedef {Object} PostData
   * @property {String} id
   * @property {String} titleShort
   * @property {String} titleLong
   * @property {String} thumbnailSrc
   * @property {Array.<String>} mainImages
   * @property {String} content
   */

  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config;

  config = {};

  config.dragCoeff = 0.01;

  config.neighborSpringCoeff = 0.00001;
  config.neighborDampingCoeff = 0.001;

  config.innerAnchorSpringCoeff = 0.00004;
  config.innerAnchorDampingCoeff = 0.001;

  config.borderAnchorSpringCoeff = 0.00004;
  config.borderAnchorDampingCoeff = 0.001;

  config.forceSuppressionLowerThreshold = 0.0005;
  config.velocitySuppressionLowerThreshold = 0.0005;
  // TODO: add similar, upper thresholds

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    config.forceSuppressionThresholdNegative = -config.forceSuppressionLowerThreshold;
    config.velocitySuppressionThresholdNegative = -config.velocitySuppressionLowerThreshold;
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {HTMLElement} svg
   * @param {Grid} grid
   * @param {Number} anchorX
   * @param {Number} anchorY
   * @param {Number} outerRadius
   * @param {Boolean} isVertical
   * @param {Number} hue
   * @param {Number} saturation
   * @param {Number} lightness
   * @param {?PostData} postData
   * @param {Number} tileIndex
   * @param {Number} rowIndex
   * @param {Number} columnIndex
   * @param {Boolean} isMarginTile
   * @param {Boolean} isBorderTile
   * @param {Boolean} isCornerTile
   * @param {Boolean} isInLargerRow
   * @param {Number} mass
   */
  function Tile(svg, grid, anchorX, anchorY, outerRadius, isVertical, hue, saturation, lightness,
                postData, tileIndex, rowIndex, columnIndex, isMarginTile, isBorderTile,
                isCornerTile, isInLargerRow, mass) {
    var tile = this;

    tile.svg = svg;
    tile.grid = grid;
    tile.element = null;
    tile.currentAnchor = {x: anchorX, y: anchorY};
    tile.originalAnchor = {x: anchorX, y: anchorY};
    tile.sectorAnchorOffset = {x: Number.NaN, y: Number.NaN};
    tile.outerRadius = outerRadius;
    tile.isVertical = isVertical;

    tile.originalColor = {h: hue, s: saturation, l: lightness};
    tile.currentColor = {h: hue, s: saturation, l: lightness};

    tile.postData = postData;
    tile.holdsContent = !!postData;
    tile.tilePost = null;
    tile.originalIndex = tileIndex;
    tile.rowIndex = rowIndex;
    tile.columnIndex = columnIndex;
    tile.isMarginTile = isMarginTile;
    tile.isBorderTile = isBorderTile;
    tile.isCornerTile = isCornerTile;
    tile.isInLargerRow = isInLargerRow;

    tile.expandedState = null;

    tile.isHighlighted = false;

    tile.imageScreenOpacity = Number.NaN;

    tile.neighborStates = [];
    tile.vertices = null;
    tile.currentVertexDeltas = null;
    tile.originalVertexDeltas = null;
    tile.expandedVertexDeltas = null;
    tile.particle = null;

    tile.setContent = setContent;
    tile.setNeighborTiles = setNeighborTiles;
    tile.setColor = setColor;
    tile.setIsHighlighted = setIsHighlighted;
    tile.update = update;
    tile.draw = draw;
    tile.applyExternalForce = applyExternalForce;
    tile.fixPosition = fixPosition;
    tile.getNeighborStates = getNeighborStates;
    tile.getIsBorderTile = getIsBorderTile;
    tile.setIsBorderTile = setIsBorderTile;
    tile.destroy = destroy;
    tile.hide = hide;
    tile.show = show;

    createElement.call(tile);
    createParticle.call(tile, mass);

    if (tile.holdsContent) {
      createTilePost.call(tile);
    }
  }

  Tile.computeVertexDeltas = computeVertexDeltas;
  Tile.setTileNeighborState = setTileNeighborState;
  Tile.initializeTileExpandedState = initializeTileExpandedState;
  Tile.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.Tile = Tile;

  initStaticFields();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Creates the polygon element for this tile.
   *
   * @this Tile
   */
  function createElement() {
    var tile, id;

    tile = this;

    id = !isNaN(tile.originalIndex) ? tile.originalIndex : parseInt(Math.random() * 1000000 + 1000);

    tile.originalVertexDeltas = computeVertexDeltas(tile.outerRadius, tile.isVertical);
    tile.currentVertexDeltas = tile.originalVertexDeltas.slice(0);
    tile.vertices = [];
    updateVertices.call(tile, tile.currentAnchor.x, tile.currentAnchor.y);

    tile.element = document.createElementNS(window.hg.util.svgNamespace, 'polygon');
    tile.svg.appendChild(tile.element);

    tile.element.id = 'hg-' + id;
    tile.element.setAttribute('data-hg-tile', 'data-hg-tile');
    tile.element.style.cursor = 'pointer';

    // Set the color and vertices
    draw.call(tile);
  }

  /**
   * Creates the particle properties for this tile.
   *
   * @this Tile
   * @param {Number} mass
   */
  function createParticle(mass) {
    var tile;

    tile = this;

    tile.particle = {};
    tile.particle.px = tile.currentAnchor.x;
    tile.particle.py = tile.currentAnchor.y;
    tile.particle.vx = 0;
    tile.particle.vy = 0;
    tile.particle.fx = 0;
    tile.particle.fy = 0;
    tile.particle.m = mass;
    tile.particle.forceAccumulatorX = 0;
    tile.particle.forceAccumulatorY = 0;
  }

  /**
   * Computes and stores the locations of the vertices of the hexagon for this tile.
   *
   * @this Tile
   * @param {Number} anchorX
   * @param {Number} anchorY
   */
  function updateVertices(anchorX, anchorY) {
    var tile, trigIndex, coordIndex;

    tile = this;

    for (trigIndex = 0, coordIndex = 0; trigIndex < 6; trigIndex += 1) {
      tile.vertices[coordIndex] = anchorX + tile.currentVertexDeltas[coordIndex++];
      tile.vertices[coordIndex] = anchorY + tile.currentVertexDeltas[coordIndex++];
    }
  }

  /**
   * Creates a new TilePost object with this Tile's post data.
   *
   * @this Tile
   */
  function createTilePost() {
    var tile = this;

    tile.element.setAttribute('data-hg-post-tilePost', 'data-hg-post-tilePost');

    tile.tilePost = new window.hg.TilePost(tile);
  }

  /**
   * Destroys this Tile's TilePost object.
   *
   * @this Tile
   */
  function destroyTilePost() {
    var tile = this;

    tile.element.removeAttribute('data-hg-post-tilePost');

    tile.tilePost.destroy();
    tile.tilePost = null;
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * Initializes some static fields that can be pre-computed.
   */
  function initStaticFields() {
    var i, theta, deltaTheta, horizontalStartTheta, verticalStartTheta;

    deltaTheta = Math.PI / 3;
    horizontalStartTheta = -deltaTheta;
    verticalStartTheta = Math.PI / 6 - 2 * deltaTheta;

    config.horizontalSines = [];
    config.horizontalCosines = [];
    for (i = 0, theta = horizontalStartTheta; i < 6; i += 1, theta += deltaTheta) {
      config.horizontalSines[i] = Math.sin(theta);
      config.horizontalCosines[i] = Math.cos(theta);
    }

    config.verticalSines = [];
    config.verticalCosines = [];
    for (i = 0, theta = verticalStartTheta; i < 6; i += 1, theta += deltaTheta) {
      config.verticalSines[i] = Math.sin(theta);
      config.verticalCosines[i] = Math.cos(theta);
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this tile's content.
   *
   * @this Tile
   * @param {?Object} postData
   */
  function setContent(postData) {
    var tile, usedToHoldContent;

    tile = this;

    usedToHoldContent = tile.holdsContent;

    tile.postData = postData;
    tile.holdsContent = !!postData;

    if (usedToHoldContent) {
      destroyTilePost.call(tile);
      createTilePost.call(tile);
    } else {
      createTilePost.call(tile);
    }
  }

  /**
   * Sets this tile's neighbor tiles.
   *
   * @this Tile
   * @param {Array.<Tile>} neighborTiles
   */
  function setNeighborTiles(neighborTiles) {
    var tile, i, neighborTile;

    tile = this;

    for (i = 0; i < 6; i += 1) {
      neighborTile = neighborTiles[i];

      setTileNeighborState(tile, i, neighborTile);
    }
  }

  /**
   * Sets this tile's color values.
   *
   * @this Tile
   * @param {Number} hue
   * @param {Number} saturation
   * @param {Number} lightness
   */
  function setColor(hue, saturation, lightness) {
    var tile = this;

    if (tile.isHighlighted) {
      hue = hue + window.hg.HighlightHoverJob.config.deltaHue;
      saturation = saturation + window.hg.HighlightHoverJob.config.deltaSaturation;
      lightness = lightness + window.hg.HighlightHoverJob.config.deltaLightness;
    }

    tile.originalColor.h = hue;
    tile.originalColor.s = saturation;
    tile.originalColor.l = lightness;
    
    tile.currentColor.h = hue;
    tile.currentColor.s = saturation;
    tile.currentColor.l = lightness;
  }

  /**
   * Sets whether this tile is highlighted.
   *
   * @this Tile
   * @param {Boolean} isHighlighted
   */
  function setIsHighlighted(isHighlighted) {
    var tile, hue, saturation, lightness, backgroundImageScreenOpacity;

    tile = this;

    if (isHighlighted) {
      if (tile.isHighlighted) {
        // Nothing is changing
        hue = tile.originalColor.h;
        saturation = tile.originalColor.s;
        lightness = tile.originalColor.l;
      } else {
        // Add the highlight
        hue = tile.originalColor.h + window.hg.HighlightHoverJob.config.deltaHue * window.hg.HighlightHoverJob.config.opacity;
        saturation = tile.originalColor.s + window.hg.HighlightHoverJob.config.deltaSaturation * window.hg.HighlightHoverJob.config.opacity;
        lightness = tile.originalColor.l + window.hg.HighlightHoverJob.config.deltaLightness * window.hg.HighlightHoverJob.config.opacity;
      }
    } else {
      if (tile.isHighlighted) {
        // Remove the highlight
        hue = tile.originalColor.h - window.hg.HighlightHoverJob.config.deltaHue * window.hg.HighlightHoverJob.config.opacity;
        saturation = tile.originalColor.s - window.hg.HighlightHoverJob.config.deltaSaturation * window.hg.HighlightHoverJob.config.opacity;
        lightness = tile.originalColor.l - window.hg.HighlightHoverJob.config.deltaLightness * window.hg.HighlightHoverJob.config.opacity;
      } else {
        // Nothing is changing
        hue = tile.originalColor.h;
        saturation = tile.originalColor.s;
        lightness = tile.originalColor.l;
      }
    }

    tile.originalColor.h = hue;
    tile.originalColor.s = saturation;
    tile.originalColor.l = lightness;

    tile.currentColor.h = hue;
    tile.currentColor.s = saturation;
    tile.currentColor.l = lightness;

    tile.isHighlighted = isHighlighted;
  }

  /**
   * Update the state of this tile particle for the current time step.
   *
   * @this Tile
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var tile, i, count, neighborStates, isBorderTile, neighborState, lx, ly, lDotX, lDotY,
        dotProd, length, temp, springForceX, springForceY;

    tile = this;

    if (!tile.particle.isFixed) {

      // Some different properties should be used when the grid is expanded
      neighborStates = tile.getNeighborStates();
      isBorderTile = tile.getIsBorderTile();

      // --- Accumulate forces --- //

      // --- Drag force --- //

      tile.particle.forceAccumulatorX += -config.dragCoeff * tile.particle.vx;
      tile.particle.forceAccumulatorY += -config.dragCoeff * tile.particle.vy;

      // --- Spring forces from neighbor tiles --- //

      for (i = 0, count = neighborStates.length; i < count; i += 1) {
        neighborState = neighborStates[i];

        if (neighborState) {
          if (neighborState.springForceX) {
            tile.particle.forceAccumulatorX += neighborState.springForceX;
            tile.particle.forceAccumulatorY += neighborState.springForceY;

            neighborState.springForceX = 0;
            neighborState.springForceY = 0;
          } else {
            lx = neighborState.tile.particle.px - tile.particle.px;
            ly = neighborState.tile.particle.py - tile.particle.py;
            lDotX = neighborState.tile.particle.vx - tile.particle.vx;
            lDotY = neighborState.tile.particle.vy - tile.particle.vy;
            dotProd = lx * lDotX + ly * lDotY;
            length = Math.sqrt(lx * lx + ly * ly);

            temp = (config.neighborSpringCoeff * (length - neighborState.restLength) +
                config.neighborDampingCoeff * dotProd / length) / length;
            springForceX = lx * temp;
            springForceY = ly * temp;

            tile.particle.forceAccumulatorX += springForceX;
            tile.particle.forceAccumulatorY += springForceY;

            neighborState.neighborsRelationshipObj.springForceX = -springForceX;
            neighborState.neighborsRelationshipObj.springForceY = -springForceY;
          }
        }
      }

      // --- Spring forces from currentAnchor point --- //

      lx = tile.currentAnchor.x - tile.particle.px;
      ly = tile.currentAnchor.y - tile.particle.py;
      length = Math.sqrt(lx * lx + ly * ly);

      if (length > 0) {
        lDotX = -tile.particle.vx;
        lDotY = -tile.particle.vy;
        dotProd = lx * lDotX + ly * lDotY;

        if (isBorderTile) {
          temp = (config.borderAnchorSpringCoeff * length + config.borderAnchorDampingCoeff *
              dotProd / length) / length;
        } else {
          temp = (config.innerAnchorSpringCoeff * length + config.innerAnchorDampingCoeff *
              dotProd / length) / length;
        }

        springForceX = lx * temp;
        springForceY = ly * temp;

        tile.particle.forceAccumulatorX += springForceX;
        tile.particle.forceAccumulatorY += springForceY;
      }

      // --- Update particle state --- //

      tile.particle.fx = tile.particle.forceAccumulatorX / tile.particle.m * deltaTime;
      tile.particle.fy = tile.particle.forceAccumulatorY / tile.particle.m * deltaTime;
      tile.particle.px += tile.particle.vx * deltaTime;
      tile.particle.py += tile.particle.vy * deltaTime;
      tile.particle.vx += tile.particle.fx;
      tile.particle.vy += tile.particle.fy;

      // Kill all velocities and forces below a threshold
      tile.particle.fx = tile.particle.fx < config.forceSuppressionLowerThreshold &&
          tile.particle.fx > config.forceSuppressionThresholdNegative ?
          0 : tile.particle.fx;
      tile.particle.fy = tile.particle.fy < config.forceSuppressionLowerThreshold &&
          tile.particle.fy > config.forceSuppressionThresholdNegative ?
          0 : tile.particle.fy;
      tile.particle.vx = tile.particle.vx < config.velocitySuppressionLowerThreshold &&
          tile.particle.vx > config.velocitySuppressionThresholdNegative ?
          0 : tile.particle.vx;
      tile.particle.vy = tile.particle.vy < config.velocitySuppressionLowerThreshold &&
          tile.particle.vy > config.velocitySuppressionThresholdNegative ?
          0 : tile.particle.vy;

      // Reset force accumulator for next time step
      tile.particle.forceAccumulatorX = 0;
      tile.particle.forceAccumulatorY = 0;

      // Compute new vertex locations
      updateVertices.call(tile, tile.particle.px, tile.particle.py);
    }
  }

  /**
   * Update the SVG attributes for this tile to match its current particle state.
   *
   * @this Tile
   */
  function draw() {
    var tile, i, pointsString, colorString;

    tile = this;

    // Set the vertices
    for (i = 0, pointsString = ''; i < 12;) {
      pointsString += tile.vertices[i++] + ',' + tile.vertices[i++] + ' ';
    }
    tile.element.setAttribute('points', pointsString);

    if (!tile.holdsContent) {
      // Set the color
      colorString = 'hsl(' + tile.currentColor.h + ',' +
      tile.currentColor.s + '%,' +
      tile.currentColor.l + '%)';
      tile.element.setAttribute('fill', colorString);
    } else {
      // Set the position and opacity of the TilePost
      tile.tilePost.draw();
    }
  }

  /**
   * Adds the given force, which will take effect during the next call to update.
   *
   * @this Tile
   * @param {Number} fx
   * @param {Number} fy
   */
  function applyExternalForce(fx, fy) {
    var tile;

    tile = this;

    tile.particle.forceAccumulatorX += fx;
    tile.particle.forceAccumulatorY += fy;
  }

  /**
   * Fixes the position of this tile to the given coordinates.
   *
   * @this Tile
   * @param {Number} px
   * @param {Number} py
   */
  function fixPosition(px, py) {
    var tile;

    tile = this;

    tile.particle.isFixed = true;
    tile.particle.px = px;
    tile.particle.py = py;
  }

  /**
   * @returns {Object}
   */
  function getNeighborStates() {
    var tile = this;
    return tile.grid.isPostOpen ? tile.expandedState.neighborStates : tile.neighborStates;
  }

  /**
   * @returns {Boolean}
   */
  function getIsBorderTile() {
    var tile = this;
    return tile.grid.isPostOpen ? tile.expandedState.isBorderTile : tile.isBorderTile;
  }

  /**
   * @param {Boolean} isBorderTile
   */
  function setIsBorderTile(isBorderTile) {
    var tile = this;

    if (tile.grid.isPostOpen) {
      tile.expandedState.isBorderTile = isBorderTile;
    } else {
      tile.isBorderTile = isBorderTile;
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Public static functions

  /**
   * Computes the offsets of the vertices from the center of the hexagon.
   *
   * @param {Number} radius
   * @param {Boolean} isVertical
   * @returns {Array.<Number>}
   */
  function computeVertexDeltas(radius, isVertical) {
    var trigIndex, coordIndex, sines, cosines, currentVertexDeltas;

    // Grab the pre-computed sine and cosine values
    if (isVertical) {
      sines = config.verticalSines;
      cosines = config.verticalCosines;
    } else {
      sines = config.horizontalSines;
      cosines = config.horizontalCosines;
    }

    for (trigIndex = 0, coordIndex = 0, currentVertexDeltas = [];
         trigIndex < 6;
         trigIndex += 1) {
      currentVertexDeltas[coordIndex++] = radius * cosines[trigIndex];
      currentVertexDeltas[coordIndex++] = radius * sines[trigIndex];
    }

    return currentVertexDeltas;
  }

  /**
   * Creates the neighbor-tile state for the given tile according to the given neighbor tile. Also
   * sets the reciprocal state for the neighbor tile.
   *
   * @param {Tile} tile
   * @param {Number} neighborRelationIndex
   * @param {?Tile} neighborTile
   */
  function setTileNeighborState(tile, neighborRelationIndex, neighborTile) {
    var neighborStates, neighborNeighborStates,
        neighborNeighborRelationIndex;

    neighborStates = tile.getNeighborStates();

    if (neighborTile) {
      // Initialize the neighbor relation data from this tile to its neighbor
      initializeTileNeighborRelationData(neighborStates, neighborRelationIndex, neighborTile);

      // -- Give the neighbor tile a reference to this tile --- //

      neighborNeighborStates = neighborTile.getNeighborStates();

      neighborNeighborRelationIndex = (neighborRelationIndex + 3) % 6;

      // Initialize the neighbor relation data from the neighbor to this tile
      initializeTileNeighborRelationData(neighborNeighborStates, neighborNeighborRelationIndex,
          tile);

      // Share references to each other's neighbor relation objects
      neighborStates[neighborRelationIndex].neighborsRelationshipObj =
          neighborNeighborStates[neighborNeighborRelationIndex];
      neighborNeighborStates[neighborNeighborRelationIndex].neighborsRelationshipObj =
          neighborStates[neighborRelationIndex];
    } else {
      neighborStates[neighborRelationIndex] = null;
    }

    // ---  --- //

    function initializeTileNeighborRelationData(neighborStates, neighborRelationIndex,
                                                neighborTile) {
      neighborStates[neighborRelationIndex] = neighborStates[neighborRelationIndex] || {
        tile: neighborTile,
        restLength: window.hg.Grid.config.tileShortLengthWithGap,
        neighborsRelationshipObj: null,
        springForceX: 0,
        springForceY: 0
      };
    }
  }

  /**
   * @param {Tile} tile
   * @param {Sector} sector
   * @param {Number} majorIndex
   * @param {Number} minorIndex
   */
  function initializeTileExpandedState(tile, sector, majorIndex, minorIndex) {
    tile.expandedState = {
      sector: sector,
      sectorMajorIndex: majorIndex,
      sectorMinorIndex: minorIndex,
      neighborStates: [],
      isBorderTile: false
    };
  }

  /**
   * @this Tile
   */
  function destroy() {
    var tile = this;

    if (tile.holdsContent) {
      destroyTilePost.call(tile);
    }
    tile.svg.removeChild(tile.element);
  }

  /**
   * Sets this Tile and its TilePost to have a display of none.
   *
   * @this Tile
   */
  function hide() {
    var tile = this;

    tile.element.style.display = 'none';
    if (tile.holdsContent) {
      tile.tilePost.elements.title.style.display = 'none';
    }
  }

  /**
   * Sets this Tile and its TilePost to have a display of block.
   *
   * @this Tile
   */
  function show() {
    var tile = this;

    tile.element.style.display = 'block';
    if (tile.holdsContent) {
      tile.tilePost.elements.title.style.display = 'block';
    }
  }

  console.log('Tile module loaded');
})();

/**
 * This module defines a constructor for TilePost objects.
 *
 * TilePost objects handle the actual textual contents of the Tile objects.
 *
 * @module TilePost
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config;

  config = {};

  config.activeScreenOpacity = 0.0;
  config.inactiveScreenOpacity = 0.8;

  config.fontSize = 18;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Tile} tile
   */
  function TilePost(tile) {
    var tilePost = this;

    tilePost.tile = tile;
    tilePost.elements = null;

    tilePost.draw = draw;
    tilePost.destroy = destroy;

    createElements.call(tilePost);
  }

  TilePost.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.TilePost = TilePost;

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this TilePost
   */
  function createElements() {
    var tilePost = this;

    var patternId = 'hg-pattern-' + tilePost.tile.postData.id;

    var screenColorString = 'hsl(' + window.hg.Grid.config.backgroundHue + ',' +
      window.hg.Grid.config.backgroundSaturation + '%,' + window.hg.Grid.config.backgroundLightness + '%)';

    var outerSideLength = window.hg.Grid.config.tileOuterRadius * 2;

    var textTop = -config.fontSize * (1.5 + 0.53 * (tilePost.tile.postData.titleShort.split('\n').length - 1));

    var longRadiusRatio = 1;
    var shortRadiusRatio = window.hg.Grid.config.tileOuterRadius / window.hg.Grid.config.tileInnerRadius;
    var offsetDistance = (1 - shortRadiusRatio) / 2;

    var imageWidth, imageHeight, imageX, imageY;
    if (tilePost.tile.grid.isVertical) {
      imageWidth = shortRadiusRatio;
      imageHeight = longRadiusRatio;
      imageX = offsetDistance;
      imageY = '0';
    } else {
      imageWidth = longRadiusRatio;
      imageHeight = shortRadiusRatio;
      imageX = '0';
      imageY = offsetDistance;
    }

    // --- Create the elements, add them to the DOM, save them in this TilePost --- //

    var backgroundPattern = document.createElementNS(window.hg.util.svgNamespace, 'pattern');
    var backgroundImage = document.createElementNS(window.hg.util.svgNamespace, 'image');
    var backgroundImageScreen = document.createElementNS(window.hg.util.svgNamespace, 'rect');
    var title = document.createElement('h2');

    tilePost.tile.grid.svgDefs.appendChild(backgroundPattern);
    backgroundPattern.appendChild(backgroundImage);
    backgroundPattern.appendChild(backgroundImageScreen);
    tilePost.tile.grid.parent.appendChild(title);

    tilePost.elements = [];
    tilePost.elements.backgroundPattern = backgroundPattern;
    tilePost.elements.backgroundImage = backgroundImage;
    tilePost.elements.backgroundImageScreen = backgroundImageScreen;
    tilePost.elements.title = title;

    // --- Set the parameters of the elements --- //

    backgroundPattern.setAttribute('id', patternId);
    backgroundPattern.setAttribute('patternContentUnits', 'objectBoundingBox');
    backgroundPattern.setAttribute('width', '1');
    backgroundPattern.setAttribute('height', '1');

    backgroundImage.setAttributeNS(window.hg.util.xlinkNamespace, 'xlink:href', tilePost.tile.postData.thumbnailSrc);
    backgroundImage.setAttribute('preserveAspectRatio', 'none');
    backgroundImage.setAttribute('x', imageX);
    backgroundImage.setAttribute('y', imageY);
    backgroundImage.setAttribute('width', imageWidth);
    backgroundImage.setAttribute('height', imageHeight);
    // TODO: this should have worked, but the aspect ratio was NOT being maintained; it may have been a browser bug
    //backgroundImage.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    //backgroundImage.setAttribute('width', '1');
    //backgroundImage.setAttribute('height', '1');

    backgroundImageScreen.setAttribute('width', '1');
    backgroundImageScreen.setAttribute('height', '1');
    backgroundImageScreen.setAttribute('fill', screenColorString);

    tilePost.tile.element.setAttribute('fill', 'url(#' + patternId + ')');

    title.innerHTML = tilePost.tile.postData.titleShort;
    title.setAttribute('data-hg-tile-title', 'data-hg-tile-title');
    title.style.position = 'absolute';
    title.style.left = -outerSideLength / 2 + 'px';
    title.style.top = textTop + 'px';
    title.style.width = outerSideLength + 'px';
    title.style.height = outerSideLength + 'px';
    title.style.fontSize = config.fontSize + 'px';
    title.style.textAlign = 'center';
    title.style.whiteSpace = 'pre-wrap';
    title.style.pointerEvents = 'none';
    title.style.zIndex = '1200';

    tilePost.tile.imageScreenOpacity = config.inactiveScreenOpacity;
    draw.call(tilePost);

    // TODO: for the canvas version: http://stackoverflow.com/a/4961439/489568
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * @this TilePost
   */
  function draw() {
    var tilePost = this;

    // Keep hovered tiles highlighted
    var backgroundImageScreenOpacity = tilePost.tile.isHighlighted ?
        window.hg.TilePost.config.activeScreenOpacity : tilePost.tile.imageScreenOpacity;

    // Have the title change across a wider opacity range than the background screen
    var titleOpacity = 0.5 + (backgroundImageScreenOpacity - 0.5) * 2;
    titleOpacity = titleOpacity > 1 ? 1 : (titleOpacity < 0 ? 0 : titleOpacity);

    window.hg.util.setTransform(tilePost.elements.title,
        'translate(' + tilePost.tile.particle.px + 'px,' + tilePost.tile.particle.py + 'px)');
    tilePost.elements.backgroundImageScreen.setAttribute('opacity', backgroundImageScreenOpacity);

    // Only set the title opacity for collapsed tiles
    if (tilePost.tile.grid.expandedTile !== tilePost.tile) {
      tilePost.elements.title.style.opacity = titleOpacity;
    }
  }

  /**
   * @this TilePost
   */
  function destroy() {
    var tilePost = this;

    tilePost.tile.grid.parent.removeChild(tilePost.elements.title);
    tilePost.tile.grid.svgDefs.removeChild(tilePost.elements.backgroundPattern);
  }

  console.log('TilePost module loaded');
})();

/**
 * @typedef {AnimationJob} ColorResetJob
 */

/**
 * This module defines a constructor for ColorResetJob objects.
 *
 * ColorResetJob objects reset tile color values during each animation frame.
 *
 * @module ColorResetJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this ColorResetJob as started.
   *
   * @this ColorResetJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this ColorResetJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this ColorResetJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, i, count;

    job = this;

    for (i = 0, count = job.grid.allTiles.length; i < count; i += 1) {
      job.grid.allTiles[i].currentColor.h = job.grid.allTiles[i].originalColor.h;
      job.grid.allTiles[i].currentColor.s = job.grid.allTiles[i].originalColor.s;
      job.grid.allTiles[i].currentColor.l = job.grid.allTiles[i].originalColor.l;
      job.grid.allTiles[i].imageScreenOpacity = window.hg.TilePost.config.inactiveScreenOpacity;
    }
  }

  /**
   * Draws the current state of this ColorResetJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this ColorResetJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this ColorResetJob, and returns the element its original form.
   *
   * @this ColorResetJob
   */
  function cancel() {
    var job = this;

    job.isComplete = true;
  }

  /**
   * @this ColorResetJob
   */
  function refresh() {
    var job = this;

    init.call(job);
  }

  /**
   * @this ColorResetJob
   */
  function init() {
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   */
  function ColorResetJob(grid) {
    var job = this;

    job.grid = grid;
    job.startTime = 0;
    job.isComplete = true;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.refresh = refresh;
    job.init = init;

    job.init();

    console.log('ColorResetJob created');
  }

  ColorResetJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.ColorResetJob = ColorResetJob;

  console.log('ColorResetJob module loaded');
})();

/**
 * @typedef {AnimationJob} ColorShiftJob
 */

/**
 * This module defines a constructor for ColorShiftJob objects.
 *
 * ColorShiftJob objects animate the colors of the tiles in a random fashion.
 *
 * @module ColorShiftJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  // TODO:

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    // TODO:
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this ColorShiftJob as started.
   *
   * @this ColorShiftJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this ColorShiftJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this ColorShiftJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job;

    job = this;

    // TODO:
  }

  /**
   * Draws the current state of this ColorShiftJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this ColorShiftJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this ColorShiftJob.
   *
   * @this ColorShiftJob
   */
  function cancel() {
    var job = this;

    job.isComplete = true;
  }

  /**
   * @this ColorShiftJob
   */
  function refresh() {
    var job = this;

    init.call(job);
  }

  /**
   * @this ColorShiftJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
    // TODO:
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   */
  function ColorShiftJob(grid) {
    var job = this;

    job.grid = grid;
    job.startTime = 0;
    job.isComplete = true;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.refresh = refresh;
    job.init = init;

    job.init();

    console.log('ColorShiftJob created');
  }

  ColorShiftJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.ColorShiftJob = ColorShiftJob;

  console.log('ColorShiftJob module loaded');
})();

/**
 * @typedef {AnimationJob} ColorWaveJob
 */

/**
 * This module defines a constructor for ColorWaveJob objects.
 *
 * ColorWaveJob objects animate the tiles of a Grid in order to create waves of color.
 *
 * @module ColorWaveJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.period = 1000;
  config.wavelength = 600;
  config.originX = -100;
  config.originY = 1400;

  // Amplitude (will range from negative to positive)
  config.deltaHue = 0;
  config.deltaSaturation = 0;
  config.deltaLightness = 5;

  config.deltaOpacityImageBackgroundScreen = 0.18;

  config.opacity = 0.5;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    config.halfPeriod = config.period / 2;
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Calculates a wave offset value for each tile according to their positions in the grid.
   *
   * @this ColorWaveJob
   */
  function initTileProgressOffsets() {
    var job, i, count, tile, length, deltaX, deltaY, halfWaveProgressWavelength;

    job = this;

    halfWaveProgressWavelength = config.wavelength / 2;
    job.waveProgressOffsetsNonContentTiles = [];
    job.waveProgressOffsetsContentTiles = [];

    // Calculate offsets for the non-content tiles
    for (i = 0, count = job.grid.allNonContentTiles.length; i < count; i += 1) {
      tile = job.grid.allNonContentTiles[i];

      deltaX = tile.originalAnchor.x - config.originX;
      deltaY = tile.originalAnchor.y - config.originY;
      length = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + config.wavelength;

      job.waveProgressOffsetsNonContentTiles[i] =
          -(length % config.wavelength - halfWaveProgressWavelength) / halfWaveProgressWavelength;
    }

    // Calculate offsets for the content tiles
    for (i = 0, count = job.grid.contentTiles.length; i < count; i += 1) {
      tile = job.grid.contentTiles[i];

      deltaX = tile.originalAnchor.x - config.originX;
      deltaY = tile.originalAnchor.y - config.originY;
      length = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + config.wavelength;

      job.waveProgressOffsetsContentTiles[i] =
          -(length % config.wavelength - halfWaveProgressWavelength) / halfWaveProgressWavelength;
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * Updates the animation progress of the given non-content tile.
   *
   * @param {Number} progress From -1 to 1
   * @param {Tile} tile
   * @param {Number} waveProgressOffset From -1 to 1
   */
  function updateNonContentTile(progress, tile, waveProgressOffset) {
    var tileProgress =
        Math.sin(((((progress + 1 + waveProgressOffset) % 2) + 2) % 2 - 1) * Math.PI);

    tile.currentColor.h += config.deltaHue * tileProgress * config.opacity;
    tile.currentColor.s += config.deltaSaturation * tileProgress * config.opacity;
    tile.currentColor.l += config.deltaLightness * tileProgress * config.opacity;
  }

  /**
   * Updates the animation progress of the given content tile.
   *
   * @param {Number} progress From -1 to 1
   * @param {Tile} tile
   * @param {Number} waveProgressOffset From -1 to 1
   */
  function updateContentTile(progress, tile, waveProgressOffset) {
    var tileProgress =
        Math.sin(((((progress + 1 + waveProgressOffset) % 2) + 2) % 2 - 1) * Math.PI) * 0.5 + 0.5;

    tile.imageScreenOpacity += -tileProgress * config.opacity *
        config.deltaOpacityImageBackgroundScreen;
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this ColorWaveJob as started.
   *
   * @this ColorWaveJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this ColorWaveJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this ColorWaveJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, progress, i, count;

    job = this;

    progress = (currentTime + config.halfPeriod) / config.period % 2 - 1;

    for (i = 0, count = job.grid.allNonContentTiles.length; i < count; i += 1) {
      updateNonContentTile(progress, job.grid.allNonContentTiles[i],
          job.waveProgressOffsetsNonContentTiles[i]);
    }

    for (i = 0, count = job.grid.contentTiles.length; i < count; i += 1) {
      updateContentTile(progress, job.grid.contentTiles[i],
          job.waveProgressOffsetsContentTiles[i]);
    }
  }

  /**
   * Draws the current state of this ColorWaveJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this ColorWaveJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this ColorWaveJob, and returns the element its original form.
   *
   * @this ColorWaveJob
   */
  function cancel() {
    var job = this;

    job.isComplete = true;
  }

  /**
   * @this ColorWaveJob
   */
  function refresh() {
    var job = this;

    init.call(job);
  }

  /**
   * @this ColorWaveJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
    initTileProgressOffsets.call(job);
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   */
  function ColorWaveJob(grid) {
    var job = this;

    job.grid = grid;
    job.waveProgressOffsetsNonContentTiles = null;
    job.waveProgressOffsetsContentTiles = null;
    job.startTime = 0;
    job.isComplete = true;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.refresh = refresh;
    job.init = init;

    job.init();

    console.log('ColorWaveJob created');
  }

  ColorWaveJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.ColorWaveJob = ColorWaveJob;

  console.log('ColorWaveJob module loaded');
})();

/**
 * @typedef {AnimationJob} DisplacementResetJob
 */

/**
 * This module defines a constructor for DisplacementResetJob objects.
 *
 * DisplacementResetJob objects reset tile displacement values during each animation frame.
 *
 * @module DisplacementResetJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this DisplacementResetJob as started.
   *
   * @this DisplacementResetJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this DisplacementResetJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this DisplacementResetJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, i, count;

    job = this;

    // Update the Tiles
    for (i = 0, count = job.grid.allTiles.length; i < count; i += 1) {
      job.grid.allTiles[i].currentAnchor.x = job.grid.allTiles[i].originalAnchor.x;
      job.grid.allTiles[i].currentAnchor.y = job.grid.allTiles[i].originalAnchor.y;
    }

    if (job.grid.isPostOpen) {
      // Update the Carousel
      job.grid.pagePost.carousel.currentIndexPositionRatio =
        job.grid.pagePost.carousel.currentIndex;
    }
  }

  /**
   * Draws the current state of this DisplacementResetJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this DisplacementResetJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this DisplacementResetJob, and returns the element its original form.
   *
   * @this DisplacementResetJob
   */
  function cancel() {
    var job = this;

    job.isComplete = true;
  }

  /**
   * @this DisplacementResetJob
   */
  function refresh() {
    var job = this;

    init.call(job);
  }

  /**
   * @this DisplacementResetJob
   */
  function init() {
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   */
  function DisplacementResetJob(grid) {
    var job = this;

    job.grid = grid;
    job.startTime = 0;
    job.isComplete = true;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.refresh = refresh;
    job.init = init;

    job.init();

    console.log('DisplacementResetJob created');
  }

  DisplacementResetJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.DisplacementResetJob = DisplacementResetJob;

  console.log('DisplacementResetJob module loaded');
})();

/**
 * @typedef {AnimationJob} DisplacementWaveJob
 */

/**
 * This module defines a constructor for DisplacementWaveJob objects.
 *
 * DisplacementWaveJob objects animate the tiles of a Grid in order to create waves of
 * motion.
 *
 * @module DisplacementWaveJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.period = 3200;
  config.wavelength = 1800;
  config.originX = 0;
  config.originY = 0;

  // Amplitude (will range from negative to positive)
  config.tileDeltaX = -15;
  config.tileDeltaY = -config.tileDeltaX * Math.sqrt(3);

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    config.halfPeriod = config.period / 2;

    config.displacementAmplitude =
        Math.sqrt(config.tileDeltaX * config.tileDeltaX +
            config.tileDeltaY * config.tileDeltaY);
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Calculates a wave offset value for each tile according to their positions in the grid.
   *
   * @this DisplacementWaveJob
   */
  function initTileProgressOffsets() {
    var job, i, count, tile, length, deltaX, deltaY, halfWaveProgressWavelength;

    job = this;

    halfWaveProgressWavelength = config.wavelength / 2;
    job.waveProgressOffsets = [];

    for (i = 0, count = job.grid.allTiles.length; i < count; i += 1) {
      tile = job.grid.allTiles[i];

      deltaX = tile.originalAnchor.x - config.originX;
      deltaY = tile.originalAnchor.y - config.originY;
      length = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + config.wavelength;

      job.waveProgressOffsets[i] = -(length % config.wavelength - halfWaveProgressWavelength)
          / halfWaveProgressWavelength;
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * Updates the animation progress of the given tile.
   *
   * @param {Number} progress
   * @param {Tile} tile
   * @param {Number} waveProgressOffset
   */
  function updateTile(progress, tile, waveProgressOffset) {
    var tileProgress =
        Math.sin(((((progress + 1 + waveProgressOffset) % 2) + 2) % 2 - 1) * Math.PI);

    tile.currentAnchor.x += config.tileDeltaX * tileProgress;
    tile.currentAnchor.y += config.tileDeltaY * tileProgress;
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this DisplacementWaveJob as started.
   *
   * @this DisplacementWaveJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this DisplacementWaveJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this DisplacementWaveJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, progress, i, count;

    job = this;

    progress = (currentTime + config.halfPeriod) / config.period % 2 - 1;

    for (i = 0, count = job.grid.allTiles.length; i < count; i += 1) {
      updateTile(progress, job.grid.allTiles[i], job.waveProgressOffsets[i]);
    }
  }

  /**
   * Draws the current state of this DisplacementWaveJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this DisplacementWaveJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this DisplacementWaveJob, and returns the element its original form.
   *
   * @this DisplacementWaveJob
   */
  function cancel() {
    var job = this;

    job.isComplete = true;
  }

  /**
   * @this DisplacementWaveJob
   */
  function refresh() {
    var job = this;

    init.call(job);
  }

  /**
   * @this DisplacementWaveJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
    initTileProgressOffsets.call(job);
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   */
  function DisplacementWaveJob(grid) {
    var job = this;

    job.grid = grid;
    job.waveProgressOffsets = null;
    job.startTime = 0;
    job.isComplete = true;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.refresh = refresh;
    job.init = init;

    job.init();

    console.log('DisplacementWaveJob created');
  }

  DisplacementWaveJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.DisplacementWaveJob = DisplacementWaveJob;

  console.log('DisplacementWaveJob module loaded');
})();

/**
 * @typedef {AnimationJob} CarouselImageSlideJob
 */

/**
 * This module defines a constructor for CarouselImageSlideJob objects.
 *
 * @module CarouselImageSlideJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 300;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this CarouselImageSlideJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('CarouselImageSlideJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;
    job.onComplete();

    job.carousel.onSlideFinished();
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this CarouselImageSlideJob as started.
   *
   * @this CarouselImageSlideJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;

    job.indexInitialDisplacement = job.carousel.previousIndex - job.carousel.currentIndex;
  }

  /**
   * Updates the animation progress of this CarouselImageSlideJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this CarouselImageSlideJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, progress;

    job = this;

    // Calculate progress with an easing function
    progress = (currentTime - job.startTime) / job.duration;
    progress = 1 - window.hg.util.easingFunctions.easeInOutCubic(progress);
    progress = progress < 0 ? 0 : progress;

    job.carousel.currentIndexPositionRatio += job.indexInitialDisplacement * progress;

    // Is the job done?
    if (progress === 0) {
      handleComplete.call(job, false);
    }
  }

  /**
   * Draws the current state of this CarouselImageSlideJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this CarouselImageSlideJob
   */
  function draw() {
    // This animation job updates the state of the carousel and has nothing of its own to draw
  }

  /**
   * Stops this CarouselImageSlideJob, and returns the element its original form.
   *
   * @this CarouselImageSlideJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this CarouselImageSlideJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   * @param {Carousel} carousel
   */
  function CarouselImageSlideJob(grid, tile, onComplete, carousel) {
    var job = this;

    job.grid = grid;
    job.baseTile = grid.expandedTile;
    job.startTime = 0;
    job.isComplete = true;
    job.carousel = carousel;

    job.indexInitialDisplacement = Number.NaN;

    job.duration = config.duration;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('CarouselImageSlideJob created: currentIndex=' + job.carousel.currentIndex +
      ', previousIndex=' + job.carousel.previousIndex);
  }

  CarouselImageSlideJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.CarouselImageSlideJob = CarouselImageSlideJob;

  console.log('CarouselImageSlideJob module loaded');
})();

/**
 * @typedef {AnimationJob} ClosePostJob
 */

/**
 * This module defines a constructor for ClosePostJob objects.
 *
 * @module ClosePostJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this ClosePostJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('ClosePostJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    destroySectors.call(job);

    // Don't reset some state if another expansion job started after this one did
    if (job.grid.lastExpansionJob === job) {
      // Destroy the expanded tile expanded state
      job.baseTile.expandedState = null;

      job.grid.sectors = [];
      job.grid.updateAllTilesCollection(job.grid.originalTiles);

      job.grid.isTransitioning = false;
      job.grid.expandedTile = null;

      // TODO: this should instead fade out the old persistent animations and fade in the new ones
      // Restart the persistent jobs now the the overall collection of tiles has changed
      window.hg.controller.resetPersistentJobs(job.grid);
    }

    job.isComplete = true;
    job.onComplete();
  }

  /**
   * @this ClosePostJob
   */
  function destroySectors() {
    var job, i, count, alsoDestroyOriginalTileExpandedState;

    job = this;

    alsoDestroyOriginalTileExpandedState = job.grid.lastExpansionJob === job;

    // Destroy the sectors
    for (i = 0, count = job.sectors.length; i < count; i += 1) {
      job.sectors[i].destroy(alsoDestroyOriginalTileExpandedState);
    }

    job.sectors = [];
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this ClosePostJob as started.
   *
   * @this ClosePostJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var panDisplacement;
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;

    job.grid.isPostOpen = false;
    job.grid.isTransitioning = true;
    job.grid.lastExpansionJob = job;

    panDisplacement = {
      x: job.grid.originalCenter.x - job.grid.panCenter.x,
      y: job.grid.originalCenter.y - job.grid.panCenter.y
    };

    // Start the sub-jobs
    window.hg.controller.transientJobs.SpreadJob.create(job.grid, job.baseTile)
        .duration = config.duration + window.hg.OpenPostJob.config.spreadDurationOffset;
    window.hg.controller.transientJobs.PanJob.create(job.grid, job.baseTile, {
      x: job.grid.panCenter.x,
      y: job.grid.panCenter.y
    })
        .duration = config.duration + window.hg.OpenPostJob.config.panDurationOffset;
    window.hg.controller.transientJobs.DilateSectorsJob.create(job.grid, job.baseTile, panDisplacement)
        .duration = config.duration + window.hg.OpenPostJob.config.dilateSectorsDurationOffset;
    window.hg.controller.transientJobs.FadePostJob.create(job.grid, job.baseTile)
        .duration = config.duration + window.hg.OpenPostJob.config.fadePostDurationOffset;

    job.grid.annotations.setExpandedAnnotations(false);

    // Turn scrolling back on
    job.grid.parent.style.overflowY = 'auto';
  }

  /**
   * Updates the animation progress of this ClosePostJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this ClosePostJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job = this;

    // Is the job done?
    if (currentTime - job.startTime >= config.duration) {
      handleComplete.call(job, false);
    }
  }

  /**
   * Draws the current state of this ClosePostJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this ClosePostJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this ClosePostJob, and returns the element its original form.
   *
   * @this ClosePostJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this ClosePostJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function ClosePostJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.baseTile = grid.expandedTile;
    job.startTime = 0;
    job.isComplete = true;
    job.sectors = grid.sectors;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('ClosePostJob created: tileIndex=' + job.baseTile.originalIndex);
  }

  ClosePostJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.ClosePostJob = ClosePostJob;

  console.log('ClosePostJob module loaded');
})();

/**
 * @typedef {AnimationJob} DilateSectorsJob
 */

/**
 * This module defines a constructor for DilateSectorsJob objects.
 *
 * @module DilateSectorsJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this DilateSectorsJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('DilateSectorsJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;
    job.onComplete();
  }

  /**
   * @this OpenPostJob
   */
  function setFinalPositions() {
    var i;

    var job = this;

    // Displace the sectors
    for (i = 0; i < 6; i += 1) {
      // Update the Sector's base position to account for the panning
      job.sectors[i].originalAnchor.x += job.panDisplacement.x;
      job.sectors[i].originalAnchor.y += job.panDisplacement.y;

      job.sectors[i].setOriginalPositionForExpansion(job.isExpanding);
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this DilateSectorsJob as started.
   *
   * @this DilateSectorsJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;

    // Set the final positions at the start, and animate everything in "reverse"
    setFinalPositions.call(job);
  }

  /**
   * Updates the animation progress of this DilateSectorsJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this DilateSectorsJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, progress, i, dx, dy;

    job = this;

    // Calculate progress with an easing function
    // Because the final positions were set at the start, the progress needs to update in "reverse"
    progress = (currentTime - job.startTime) / job.duration;
    progress = 1 - window.hg.util.easingFunctions.easeOutQuint(progress);
    progress = progress < 0 ? 0 : (job.isExpanding ? progress : -progress);

    // Update the offsets for each of the six sectors
    for (i = 0; i < 6; i += 1) {
      dx = job.sectors[i].expandedDisplacement.x * progress;
      dy = job.sectors[i].expandedDisplacement.y * progress;

      job.sectors[i].updateCurrentPosition(dx, dy);
    }

    // Is the job done?
    if (progress === 0) {
      handleComplete.call(job, false);
    }
  }

  /**
   * Draws the current state of this DilateSectorsJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this DilateSectorsJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this DilateSectorsJob, and returns the element its original form.
   *
   * @this DilateSectorsJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this DilateSectorsJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   * @param {{x:Number,y:Number}} panDisplacement
   */
  function DilateSectorsJob(grid, tile, onComplete, panDisplacement) {
    var job = this;

    job.grid = grid;
    job.baseTile = grid.expandedTile;
    job.startTime = 0;
    job.isComplete = true;
    job.panDisplacement = panDisplacement;
    job.sectors = grid.sectors;
    job.parentExpansionJob = job.grid.lastExpansionJob;
    job.isExpanding = grid.isPostOpen;

    job.duration = config.duration;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('DilateSectorsJob created: tileIndex=' + job.baseTile.originalIndex);
  }

  DilateSectorsJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.DilateSectorsJob = DilateSectorsJob;

  console.log('DilateSectorsJob module loaded');
})();

/**
 * @typedef {AnimationJob} DisplacementRadiateJob
 */

/**
 * This module defines a constructor for DisplacementRadiateJob objects.
 *
 * @module DisplacementRadiateJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;
  config.waveSpeed = 3; // pixels / millisecond
  config.waveWidth = 500;

  config.displacementDistance = 50;

  config.isRecurring = false;
  config.avgDelay = 4000;
  config.delayDeviationRange = 3800;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    // TODO:
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Calculates and stores the maximal displacement values for all tiles.
   *
   * @this DisplacementRadiateJob
   */
  function initializeDisplacements() {
    // TODO:
//    var job, i, iCount, j, jCount, k, tiles, displacementRatio;
//
//    job = this;
//
//    displacementRatio =
//        (window.hg.Grid.config.tileShortLengthWithGap + window.hg.Grid.config.tileGap) /
//        (window.hg.Grid.config.tileShortLengthWithGap);
//
//    job.displacements = [];
//
//    k = 0;
//
//    if (job.grid.isPostOpen) {
//      // Consider all of the old AND new tiles
//      for (i = 0, iCount = job.grid.sectors.length; i < iCount; i += 1) {
//        tiles = job.grid.sectors[i].tiles;
//
//        for (j = 0, jCount = tiles.length; j < jCount; j += 1) {
//          job.displacements[k] = {
//            tile: tiles[j],
//            displacementX: displacementRatio *
//                (tiles[j].originalAnchorX - job.tile.originalAnchorX),
//            displacementY: displacementRatio *
//                (tiles[j].originalAnchorY - job.tile.originalAnchorY)
//          };
//          k += 1;
//        }
//      }
//    } else {
//      for (i = 0, iCount = job.grid.originalTiles.length; i < iCount; i += 1) {
//        job.displacements[i] = {
//          tile: job.grid.originalTiles[i],
//          displacementX: displacementRatio *
//              (job.grid.originalTiles[i].originalAnchorX - job.tile.originalAnchorX),
//          displacementY: displacementRatio *
//              (job.grid.originalTiles[i].originalAnchorY - job.tile.originalAnchorY)
//        };
//      }
//    }
  }

  /**
   * @this DisplacementRadiateJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('DisplacementRadiateJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;

    job.onComplete();
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this DisplacementRadiateJob as started.
   *
   * @this DisplacementRadiateJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this DisplacementRadiateJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this DisplacementRadiateJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    // TODO:
//    var job, progress, i, count;
//
//    job = this;
//
//    if (currentTime > job.startTime + config.duration) {
//      handleComplete.call(job, false);
//    } else {
//      // Ease-out halfway, then ease-in back
//      progress = (currentTime - job.startTime) / config.duration;
//      progress = (progress > 0.5 ? 1 - progress : progress) * 2;
//      progress = window.hg.util.easingFunctions.easeOutQuint(progress);
//
//      // Displace the tiles
//      for (i = 0, count = job.displacements.length; i < count; i += 1) {
//        job.displacements[i].tile.anchorX += job.displacements[i].displacementX * progress;
//        job.displacements[i].tile.anchorY += job.displacements[i].displacementY * progress;
//      }
//    }
  }

  /**
   * Draws the current state of this DisplacementRadiateJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this DisplacementRadiateJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this DisplacementRadiateJob, and returns the element its original form.
   *
   * @this DisplacementRadiateJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this DisplacementRadiateJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
    // TODO:
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function DisplacementRadiateJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.tile = tile;
    job.startTime = 0;
    job.isComplete = true;

    job.displacements = null;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    initializeDisplacements.call(job);

    console.log('DisplacementRadiateJob created: tileIndex=' + job.tile.originalIndex);
  }

  DisplacementRadiateJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.DisplacementRadiateJob = DisplacementRadiateJob;

  console.log('DisplacementRadiateJob module loaded');
})();

/**
 * @typedef {AnimationJob} FadePostJob
 */

/**
 * This module defines a constructor for FadePostJob objects.
 *
 * @module FadePostJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;

  config.quick1FadeDurationRatio = 0.7;
  config.quick2FadeDurationRatio = 0.3;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this FadePostJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('FadePostJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;
    job.onComplete();

    if (!job.isFadingIn) {
      // Don't reset some state if another expansion job started after this one did
      if (job.parentExpansionJob === job.grid.lastExpansionJob) {
        job.grid.destroyPagePost();
      } else {
        job.pagePost.destroy();

        job.baseTile.currentVertexDeltas = job.baseTile.originalVertexDeltas.slice(0);
      }

      job.baseTile.show();
    } else {
      // Don't reset some state if another expansion job started after this one did
      if (job.parentExpansionJob === job.grid.lastExpansionJob) {
        job.baseTile.hide();
      }
    }

    job.baseTile.element.style.pointerEvents = 'auto';
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * @param {Array.<Number>} currentVertexDeltas
   * @param {Array.<Number>} oldVertexDeltas
   * @param {Array.<Number>} newVertexDeltas
   * @param {Number} progress
   */
  function interpolateVertexDeltas(currentVertexDeltas, oldVertexDeltas, newVertexDeltas,
                                   progress) {
    var i, count;

    for (i = 0, count = currentVertexDeltas.length; i < count; i += 1) {
      currentVertexDeltas[i] =
        oldVertexDeltas[i] + (newVertexDeltas[i] - oldVertexDeltas[i]) * progress;
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this FadePostJob as started.
   *
   * @this FadePostJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var expandedTileOuterRadius;
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;

    job.pagePostStartPosition = {};
    job.pagePostDisplacement = {};

    job.baseTile.show();

    if (job.isFadingIn) {
      job.pagePostStartPosition.x = job.baseTile.particle.px;
      job.pagePostStartPosition.y = job.baseTile.particle.py;
      job.pagePostDisplacement.x = job.grid.originalCenter.x - job.pagePostStartPosition.x;
      job.pagePostDisplacement.y = job.grid.originalCenter.y - job.pagePostStartPosition.y +
      job.grid.scrollTop;

      job.pagePost = job.grid.createPagePost(job.baseTile, job.pagePostStartPosition);

      expandedTileOuterRadius = window.hg.OpenPostJob.config.expandedDisplacementTileCount *
      window.hg.Grid.config.tileShortLengthWithGap;

      job.baseTile.expandedVertexDeltas =
        window.hg.Tile.computeVertexDeltas(expandedTileOuterRadius, job.grid.isVertical);
    } else {
      job.pagePostStartPosition.x = job.grid.originalCenter.x;
      job.pagePostStartPosition.y = job.grid.originalCenter.y + job.grid.scrollTop;
      job.pagePostDisplacement.x = job.pagePostStartPosition.x - job.grid.currentCenter.x;
      job.pagePostDisplacement.y = job.pagePostStartPosition.y - job.grid.currentCenter.y -
      job.grid.scrollTop;
    }

    job.baseTile.element.style.pointerEvents = 'none';
  }

  /**
   * Updates the animation progress of this FadePostJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this FadePostJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function updateFadeIn(currentTime, deltaTime) {
    var job, progress, uneasedProgress, quick1FadeProgress, quick2FadeProgress;

    job = this;

    // Calculate progress with an easing function
    progress = (currentTime - job.startTime) / job.duration;
    uneasedProgress = progress;
    progress = window.hg.util.easingFunctions.easeOutCubic(progress);
    progress = progress > 1 ? 1 : progress;

    // Some parts of the animation should happen at different speeds
    quick1FadeProgress = progress / config.quick1FadeDurationRatio;
    quick1FadeProgress = (quick1FadeProgress > 1 ? 1 : quick1FadeProgress);
    quick2FadeProgress = progress / config.quick2FadeDurationRatio;
    quick2FadeProgress = (quick2FadeProgress > 1 ? 1 : quick2FadeProgress);

    // Update the opacity of the center Tile
    job.baseTile.element.style.opacity = 1 - quick1FadeProgress;
    job.baseTile.tilePost.elements.title.style.opacity = 1 - quick2FadeProgress;

    // Update the opacity of the PagePost
    job.pagePost.opacity = uneasedProgress;

    // Update the position of the PagePost
    job.pagePost.center.x = job.pagePostStartPosition.x +
    job.pagePostDisplacement.x * progress;
    job.pagePost.center.y = job.pagePostStartPosition.y +
    job.pagePostDisplacement.y * progress;

    interpolateVertexDeltas(job.baseTile.currentVertexDeltas, job.baseTile.originalVertexDeltas,
      job.baseTile.expandedVertexDeltas, quick1FadeProgress);

    // Is the job done?
    if (progress === 1) {
      handleComplete.call(job, false);
    }
  }

  /**
   * Updates the animation progress of this FadePostJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this FadePostJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function updateFadeOut(currentTime, deltaTime) {
    var job, progress, quick1FadeProgress;

    job = this;

    // Calculate progress with an easing function
    progress = (currentTime - job.startTime) / job.duration;
    progress = window.hg.util.easingFunctions.easeOutQuint(progress);
    progress = progress > 1 ? 1 : progress;

    // Some parts of the animation should happen at different speeds
    quick1FadeProgress = progress / config.quick1FadeDurationRatio;
    quick1FadeProgress = (quick1FadeProgress > 1 ? 1 : quick1FadeProgress);

    // Update the opacity of the center Tile
    job.baseTile.element.style.opacity = progress;
    job.baseTile.tilePost.elements.title.style.opacity = progress;

    // Update the opacity of the PagePost
    job.pagePost.opacity = 1 - quick1FadeProgress;

    // Update the position of the PagePost
    job.pagePost.center.x = job.pagePostStartPosition.x +
    job.pagePostDisplacement.x * progress;
    job.pagePost.center.y = job.pagePostStartPosition.y +
    job.pagePostDisplacement.y * progress;

    interpolateVertexDeltas(job.baseTile.currentVertexDeltas, job.baseTile.expandedVertexDeltas,
      job.baseTile.originalVertexDeltas, quick1FadeProgress);

    // Is the job done?
    if (progress === 1) {
      handleComplete.call(job, false);
    }
  }

  /**
   * Draws the current state of this FadePostJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this FadePostJob
   */
  function draw() {
    var job = this;

    job.pagePost.draw();
  }

  /**
   * Stops this FadePostJob, and returns the element its original form.
   *
   * @this FadePostJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this FadePostJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function FadePostJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.baseTile = grid.expandedTile;
    job.startTime = 0;
    job.isComplete = true;
    job.pagePost = grid.pagePost;
    job.parentExpansionJob = job.grid.lastExpansionJob;
    job.isFadingIn = grid.isPostOpen;
    job.pagePostStartPosition = null;
    job.pagePostDisplacement = null;

    job.duration = config.duration;

    job.start = start;
    job.update = job.isFadingIn ? updateFadeIn : updateFadeOut;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('FadePostJob created: tileIndex=' + job.baseTile.originalIndex +
    ', isFadingIn=' + job.isFadingIn);
  }

  FadePostJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.FadePostJob = FadePostJob;

  console.log('FadePostJob module loaded');
})();

/**
 * @typedef {AnimationJob} HighlightHoverJob
 */

/**
 * This module defines a constructor for HighlightHoverJob objects.
 *
 * @module HighlightHoverJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;

  config.deltaHue = 0;
  config.deltaSaturation = 0;
  config.deltaLightness = 50;

  config.opacity = 0.5;

  config.isRecurring = false;
  config.avgDelay = 30;
  config.delayDeviationRange = 20;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this HighlightHoverJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

//    console.log('HighlightHoverJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;

    job.onComplete();
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * Updates the background image screen opacity of the given content tile according to the given
   * durationRatio.
   *
   * @param {Tile} tile
   * @param {Number} durationRatio Specifies how far this animation is through its overall
   * duration.
   */
  function updateContentTile(tile, durationRatio) {
    var opacity = window.hg.TilePost.config.activeScreenOpacity +
        (durationRatio * (window.hg.TilePost.config.inactiveScreenOpacity -
        window.hg.TilePost.config.activeScreenOpacity));

    tile.imageScreenOpacity = opacity;
  }

  /**
   * Updates the color of the given non-content tile according to the given durationRatio.
   *
   * @param {Tile} tile
   * @param {Number} durationRatio Specifies how far this animation is through its overall
   * duration.
   */
  function updateNonContentTile(tile, durationRatio) {
    var opacity = config.opacity * (1 - durationRatio);

    tile.currentColor.h += config.deltaHue * opacity;
    tile.currentColor.s += config.deltaSaturation * opacity;
    tile.currentColor.l += config.deltaLightness * opacity;
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this HighlightHoverJob as started.
   *
   * @this HighlightHoverJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this HighlightHoverJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this HighlightHoverJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, durationRatio;

    job = this;

    // When the tile is re-highlighted after this job has started, then this job should be
    // cancelled
    if (job.tile.isHighlighted) {
      job.cancel();
      return;
    }

    if (currentTime > job.startTime + config.duration) {
      job.updateTile(job.tile, 1);
      handleComplete.call(job, false);
    } else {
      durationRatio = (currentTime - job.startTime) / config.duration;

      job.updateTile(job.tile, durationRatio);
    }
  }

  /**
   * Draws the current state of this HighlightHoverJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this HighlightHoverJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this HighlightHoverJob, and returns the element its original form.
   *
   * @this HighlightHoverJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this HighlightHoverJob
   */
  function init() {
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function HighlightHoverJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.tile = tile;
    job.startTime = 0;
    job.isComplete = true;

    job.updateTile = tile.holdsContent ? updateContentTile : updateNonContentTile;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

//    console.log('HighlightHoverJob created: tileIndex=' + job.tile.originalIndex);
  }

  HighlightHoverJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.HighlightHoverJob = HighlightHoverJob;

  console.log('HighlightHoverJob module loaded');
})();

/**
 * @typedef {AnimationJob} HighlightRadiateJob
 */

/**
 * This module defines a constructor for HighlightRadiateJob objects.
 *
 * @module HighlightRadiateJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.shimmerSpeed = 3; // pixels / millisecond
  config.shimmerWaveWidth = 500;
  config.duration = 500;

  config.deltaHue = 0;
  config.deltaSaturation = 0;
  config.deltaLightness = 50;

  config.opacity = 0.5;

  config.isRecurring = false;
  config.avgDelay = 4000;
  config.delayDeviationRange = 3800;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Calculates the distance from each tile in the grid to the starting point of this
   * HighlightRadiateJob.
   *
   * This cheats by only calculating the distance to the tiles' original center. This allows us to
   * not need to re-calculate tile distances during each time step.
   *
   * @this HighlightRadiateJob
   */
  function calculateTileDistances() {
    var job, i, count, deltaX, deltaY, distanceOffset;

    job = this;

    distanceOffset = -window.hg.Grid.config.tileShortLengthWithGap;

    for (i = 0, count = job.grid.allNonContentTiles.length; i < count; i += 1) {
      deltaX = job.grid.allNonContentTiles[i].originalAnchor.x - job.startPoint.x;
      deltaY = job.grid.allNonContentTiles[i].originalAnchor.y - job.startPoint.y;
      job.distancesNonContentTiles[i] = Math.sqrt(deltaX * deltaX + deltaY * deltaY) +
          distanceOffset;
    }

    for (i = 0, count = job.grid.contentTiles.length; i < count; i += 1) {
      deltaX = job.grid.contentTiles[i].originalAnchor.x - job.startPoint.x;
      deltaY = job.grid.contentTiles[i].originalAnchor.y - job.startPoint.y;
      job.distancesContentTiles[i] = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + distanceOffset;
    }
  }

  /**
   * @this HighlightRadiateJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('HighlightRadiateJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;

    job.onComplete();
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  /**
   * Updates the color of the given non-content tile according to the given waveWidthRatio and
   * durationRatio.
   *
   * @param {Tile} tile
   * @param {Number} waveWidthRatio Specifies the tile's relative distance to the min and max
   * shimmer distances.
   * @param {Number} oneMinusDurationRatio Specifies how far this animation is through its overall
   * duration.
   */
  function updateNonContentTile(tile, waveWidthRatio, oneMinusDurationRatio) {
    var opacity = waveWidthRatio * config.opacity * oneMinusDurationRatio;

    tile.currentColor.h += config.deltaHue * opacity;
    tile.currentColor.s += config.deltaSaturation * opacity;
    tile.currentColor.l += config.deltaLightness * opacity;
  }

  /**
   * Updates the color of the given content tile according to the given waveWidthRatio and
   * durationRatio.
   *
   * @param {Tile} tile
   * @param {Number} waveWidthRatio Specifies the tile's relative distance to the min and max
   * shimmer distances.
   * @param {Number} oneMinusDurationRatio Specifies how far this animation is through its overall
   * duration.
   */
  function updateContentTile(tile, waveWidthRatio, oneMinusDurationRatio) {
    tile.imageScreenOpacity += -waveWidthRatio * config.opacity * oneMinusDurationRatio *
        (window.hg.TilePost.config.inactiveScreenOpacity -
        window.hg.TilePost.config.activeScreenOpacity);
  }

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this HighlightRadiateJob as started.
   *
   * @this HighlightRadiateJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this HighlightRadiateJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this HighlightRadiateJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, currentMaxDistance, currentMinDistance, i, count, distance, waveWidthRatio,
        oneMinusDurationRatio, animatedSomeTile;

    job = this;

    if (currentTime > job.startTime + config.duration) {
      handleComplete.call(job, false);
    } else {
      oneMinusDurationRatio = 1 - (currentTime - job.startTime) / config.duration;

      currentMaxDistance = config.shimmerSpeed * (currentTime - job.startTime);
      currentMinDistance = currentMaxDistance - config.shimmerWaveWidth;

      animatedSomeTile = false;

      for (i = 0, count = job.grid.allNonContentTiles.length; i < count; i += 1) {
        distance = job.distancesNonContentTiles[i];

        if (distance > currentMinDistance && distance < currentMaxDistance) {
          waveWidthRatio = (distance - currentMinDistance) / config.shimmerWaveWidth;

          updateNonContentTile(job.grid.allNonContentTiles[i], waveWidthRatio,
              oneMinusDurationRatio);

          animatedSomeTile = true;
        }
      }

      for (i = 0, count = job.grid.contentTiles.length; i < count; i += 1) {
        distance = job.distancesContentTiles[i];

        if (distance > currentMinDistance && distance < currentMaxDistance) {
          waveWidthRatio = (distance - currentMinDistance) / config.shimmerWaveWidth;

          updateContentTile(job.grid.contentTiles[i], waveWidthRatio, oneMinusDurationRatio);

          animatedSomeTile = true;
        }
      }

      if (!animatedSomeTile) {
        handleComplete.call(job, false);
      }
    }
  }

  /**
   * Draws the current state of this HighlightRadiateJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this HighlightRadiateJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this HighlightRadiateJob, and returns the element its original form.
   *
   * @this HighlightRadiateJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this HighlightRadiateJob
   */
  function init() {
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} [onComplete]
   */
  function HighlightRadiateJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.startPoint = {x: tile.originalAnchor.x, y: tile.originalAnchor.y};
    job.distancesNonContentTiles = [];
    job.distancesContentTiles = [];
    job.startTime = 0;
    job.isComplete = true;

    job.onComplete = onComplete || function () {};

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.init = init;

    calculateTileDistances.call(job);

    console.log('HighlightRadiateJob created: tileIndex=' + (tile && tile.originalIndex));
  }

  HighlightRadiateJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.HighlightRadiateJob = HighlightRadiateJob;

  console.log('HighlightRadiateJob module loaded');
})();

/**
 * @typedef {AnimationJob} IntraTileRadiateJob
 */

/**
 * This module defines a constructor for IntraTileRadiateJob objects.
 *
 * @module IntraTileRadiateJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;

  // TODO:

  config.isRecurring = false;
  config.avgDelay = 4000;
  config.delayDeviationRange = 3800;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    // TODO:
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this IntraTileRadiateJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('IntraTileRadiateJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;

    job.onComplete();
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this IntraTileRadiateJob as started.
   *
   * @this IntraTileRadiateJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this IntraTileRadiateJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this IntraTileRadiateJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    // TODO:
//    var job, currentMaxDistance, currentMinDistance, i, count, distance, waveWidthRatio,
//        oneMinusDurationRatio, animatedSomeTile;
//
//    job = this;
//
//    if (currentTime > job.startTime + config.duration) {
//      handleComplete.call(job, false);
//    } else {
//      oneMinusDurationRatio = 1 - (currentTime - job.startTime) / config.duration;
//
//      currentMaxDistance = config.shimmerSpeed * (currentTime - job.startTime);
//      currentMinDistance = currentMaxDistance - config.shimmerWaveWidth;
//
//      animatedSomeTile = false;
//
//      for (i = 0, count = job.grid.originalTiles.length; i < count; i += 1) {
//        distance = job.tileDistances[i];
//
//        if (distance > currentMinDistance && distance < currentMaxDistance) {
//          waveWidthRatio = (distance - currentMinDistance) / config.shimmerWaveWidth;
//
//          updateTile(job.grid.originalTiles[i], waveWidthRatio, oneMinusDurationRatio);
//
//          animatedSomeTile = true;
//        }
//      }
//
//      if (!animatedSomeTile) {
//        handleComplete.call(job, false);
//      }
//    }**;
  }

  /**
   * Draws the current state of this IntraTileRadiateJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this IntraTileRadiateJob
   */
  function draw() {
    var job;

    job = this;

    // TODO:
  }

  /**
   * Stops this IntraTileRadiateJob, and returns the element its original form.
   *
   * @this IntraTileRadiateJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this IntraTileRadiateJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
    // TODO:
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function IntraTileRadiateJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.tile = tile;
    job.startTime = 0;
    job.isComplete = true;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('IntraTileRadiateJob created: tileIndex=' + job.tile.originalIndex);
  }

  IntraTileRadiateJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.IntraTileRadiateJob = IntraTileRadiateJob;

  console.log('IntraTileRadiateJob module loaded');
})();

/**
 * @typedef {AnimationJob} LineJob
 */

/**
 * This module defines a constructor for LineJob objects.
 *
 * @module LineJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 2000;
  config.lineWidth = 28;
  config.lineLength = 60000;
  config.lineSidePeriod = 5; // milliseconds per tile side

  config.startSaturation = 100;
  config.startLightness = 100;
  config.startOpacity = 0.6;

  config.endSaturation = 30;
  config.endLightness = 80;
  config.endOpacity = 0;

  config.sameDirectionProb = 0.8;

  config.blurStdDeviation = 2;
  config.isBlurOn = false;

  config.isRecurring = true;
  config.avgDelay = 2200;
  config.delayDeviationRange = 2100;

  // ---  --- //

  config.NEIGHBOR = 0;
  config.LOWER_SELF = 1;
  config.UPPER_SELF = 2;

  config.oppositeDirectionProb = 0;
  config.epsilon = 0.00001;

  config.haveDefinedLineBlur = false;
  config.filterId = 'random-line-filter';

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    config.distantSidewaysDirectionProb = (1 - config.sameDirectionProb) / 2;
    config.closeSidewaysDirectionProb = (1 - config.oppositeDirectionProb) / 2;
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Creates an SVG definition that is used for blurring the lines of LineJobs.
   *
   * @this LineJob
   */
  function defineLineBlur() {
    var job, filter, feGaussianBlur;

    job = this;

    // Create the elements

    filter = document.createElementNS(window.hg.util.svgNamespace, 'filter');
    job.grid.svgDefs.appendChild(filter);

    feGaussianBlur = document.createElementNS(window.hg.util.svgNamespace, 'feGaussianBlur');
    filter.appendChild(feGaussianBlur);

    // Define the blur

    filter.setAttribute('id', config.filterId);
    filter.setAttribute('x', '-10%');
    filter.setAttribute('y', '-10%');
    filter.setAttribute('width', '120%');
    filter.setAttribute('height', '120%');

    feGaussianBlur.setAttribute('in', 'SourceGraphic');
    feGaussianBlur.setAttribute('result', 'blurOut');

    config.filter = filter;
    config.feGaussianBlur = feGaussianBlur;
  }

  /**
   * Creates the start and end hue for the line of this animation.
   *
   * @this LineJob
   */
  function createHues() {
    var job;

    job = this;

    job.startHue = Math.random() * 360;
    job.endHue = Math.random() * 360;
  }

  /**
   * Creates the polyline SVG element that is used to render this animation.
   *
   * @this LineJob
   */
  function createPolyline() {
    var job;

    job = this;

    job.polyline = document.createElementNS(window.hg.util.svgNamespace, 'polyline');
    job.grid.svg.insertBefore(job.polyline, job.grid.svg.firstChild);

    job.polyline.setAttribute('fill-opacity', '0');

    if (config.isBlurOn) {
      job.polyline.setAttribute('filter', 'url(#' + config.filterId + ')');
    }
  }

  /**
   * Updates the color values of the line of this animation.
   *
   * @this LineJob
   */
  function updateColorValues() {
    var job, progress, oneMinusProgress;

    job = this;

    progress = job.ellapsedTime / job.duration;
    oneMinusProgress = 1 - progress;

    job.currentColor.h = oneMinusProgress * job.startHue + progress * job.endHue;
    job.currentColor.s = oneMinusProgress * job.startSaturation + progress * job.endSaturation;
    job.currentColor.l = oneMinusProgress * job.startLightness + progress * job.endLightness;
    job.currentOpacity = oneMinusProgress * job.startOpacity + progress * job.endOpacity;
  }

  /**
   * Updates the state of this job to handle its completion.
   *
   * @this LineJob
   */
  function handleCompletion() {
    var job;

    job = this;

    console.log('LineJob completed');

    if (job.polyline) {
      job.grid.svg.removeChild(job.polyline);
      job.polyline = null;
    }

    job.tiles = [];
    job.corners = [];
    job.direction = Number.NaN;
    job.currentCornerIndex = Number.NaN;
    job.hasReachedEdge = true;

    job.isComplete = true;

    job.onComplete(job);
  }

  /**
   * Determines whether this LineJob has reached the edge of the grid.
   *
   * @this LineJob
   */
  function checkHasAlmostReachedEdge() {
    var job;

    job = this;

    if (job.direction === (job.corners[job.currentCornerIndex] + 3) % 6) {
      // When the job is at the opposite corner of a tile from the direction it is headed, then it
      // has not reached the edge
      job.hasAlmostReachedEdge = false;
    } else {
      job.hasAlmostReachedEdge = !job.lowerNeighbors[job.currentCornerIndex] ||
          !job.upperNeighbors[job.currentCornerIndex];
    }
  }

  /**
   * Determines the neighbors of this job's current tile at the current corner.
   *
   * @this LineJob
   */
  function determineNeighbors() {
    var job, lowerNeigborTileIndex, upperNeigborTileIndex, currentCorner;

    job = this;
    currentCorner = job.corners[job.currentCornerIndex];

    if (job.grid.isVertical) {
      lowerNeigborTileIndex = (currentCorner + 5) % 6;
      upperNeigborTileIndex = currentCorner;
    } else {
      lowerNeigborTileIndex = currentCorner;
      upperNeigborTileIndex = (currentCorner + 1) % 6;
    }

    job.lowerNeighbors[job.currentCornerIndex] =
        job.tiles[job.currentCornerIndex].neighborStates[lowerNeigborTileIndex];
    job.upperNeighbors[job.currentCornerIndex] =
        job.tiles[job.currentCornerIndex].neighborStates[upperNeigborTileIndex];

    job.lowerNeighborCorners[job.currentCornerIndex] = (currentCorner + 2) % 6;
    job.upperNeighborCorners[job.currentCornerIndex] = (currentCorner + 4) % 6;
  }

  /**
   * Returns the next vertex in the path of this animation.
   *
   * @this LineJob
   */
  function chooseNextVertex() {
    var job, cornerConfig, neighborProb, lowerSelfProb, upperSelfProb, random, relativeDirection,
        absoluteDirection, nextCorner, nextTile, currentCorner;

    job = this;
    currentCorner = job.corners[job.currentCornerIndex];

    // The first segment of a line animation is forced to go in a given direction
    if (job.currentCornerIndex === 0) {
      relativeDirection = job.forcedInitialRelativeDirection;
      job.latestDirection = relativeToAbsoluteDirection(relativeDirection, currentCorner);
    } else {
      cornerConfig = (currentCorner - job.direction + 6) % 6;

      // Determine relative direction probabilities
      switch (cornerConfig) {
        case 0:
          neighborProb = job.sameDirectionProb;
          lowerSelfProb = config.distantSidewaysDirectionProb;
          upperSelfProb = config.distantSidewaysDirectionProb;
          break;
        case 1:
          neighborProb = config.closeSidewaysDirectionProb;
          lowerSelfProb = config.closeSidewaysDirectionProb;
          upperSelfProb = config.oppositeDirectionProb;
          break;
        case 2:
          neighborProb = config.distantSidewaysDirectionProb;
          lowerSelfProb = job.sameDirectionProb;
          upperSelfProb = config.distantSidewaysDirectionProb;
          break;
        case 3:
          neighborProb = config.oppositeDirectionProb;
          lowerSelfProb = config.closeSidewaysDirectionProb;
          upperSelfProb = config.closeSidewaysDirectionProb;
          break;
        case 4:
          neighborProb = config.distantSidewaysDirectionProb;
          lowerSelfProb = config.distantSidewaysDirectionProb;
          upperSelfProb = job.sameDirectionProb;
          break;
        case 5:
          neighborProb = config.closeSidewaysDirectionProb;
          lowerSelfProb = config.oppositeDirectionProb;
          upperSelfProb = config.closeSidewaysDirectionProb;
          break;
        default:
          throw new Error('Invalid state: cornerConfig=' + cornerConfig);
      }

      // Determine the next direction to travel
      do {
        // Pick a random direction
        random = Math.random();
        relativeDirection = random < neighborProb ? config.NEIGHBOR :
                random < neighborProb + lowerSelfProb ? config.LOWER_SELF : config.UPPER_SELF;
        absoluteDirection = relativeToAbsoluteDirection(relativeDirection, currentCorner);

        // Disallow the line from going back the way it just came
      } while (absoluteDirection === (job.latestDirection + 3) % 6);

      job.latestDirection = absoluteDirection;
    }

    // Determine the next corner configuration
    switch (relativeDirection) {
      case config.NEIGHBOR:
        if (job.grid.isVertical) {
          nextCorner = (currentCorner + 1) % 6;
          nextTile = job.tiles[job.currentCornerIndex].neighborStates[(currentCorner + 5) % 6].tile;
        } else {
          nextCorner = (currentCorner + 1) % 6;
          nextTile = job.tiles[job.currentCornerIndex].neighborStates[currentCorner].tile;
        }
        break;
      case config.LOWER_SELF:
        nextCorner = (currentCorner + 5) % 6;
        nextTile = job.tiles[job.currentCornerIndex];
        break;
      case config.UPPER_SELF:
        nextCorner = (currentCorner + 1) % 6;
        nextTile = job.tiles[job.currentCornerIndex];
        break;
      default:
        throw new Error('Invalid state: relativeDirection=' + relativeDirection);
    }

    job.currentCornerIndex = job.corners.length;

    job.corners[job.currentCornerIndex] = nextCorner;
    job.tiles[job.currentCornerIndex] = nextTile;

    determineNeighbors.call(job);
    checkHasAlmostReachedEdge.call(job);
  }

  /**
   * Translates the givern relative direction to an absolute direction.
   *
   * @param {Number} relativeDirection
   * @param {Number} corner
   * @returns {Number}
   */
  function relativeToAbsoluteDirection(relativeDirection, corner) {
    switch (relativeDirection) {
      case config.NEIGHBOR:
        return corner;
      case config.LOWER_SELF:
        return (corner + 4) % 6;
      case config.UPPER_SELF:
        return (corner + 2) % 6;
      default:
        throw new Error('Invalid state: relativeDirection=' + relativeDirection);
    }
  }

  /**
   * Updates the parameters of the segments of this animation.
   *
   * @this LineJob
   */
  function updateSegments() {
    var job, distanceTravelled, frontSegmentLength, backSegmentLength, segmentsTouchedCount,
        distancePastEdge, segmentsPastEdgeCount;

    job = this;

    // --- Compute some values of the polyline at the current time --- //

    distanceTravelled = job.ellapsedTime / job.lineSidePeriod * window.hg.Grid.config.tileOuterRadius;
    segmentsTouchedCount = parseInt(job.ellapsedTime / job.lineSidePeriod) + 1;

    // Add additional vertices to the polyline as needed
    while (segmentsTouchedCount >= job.corners.length && !job.hasAlmostReachedEdge) {
      chooseNextVertex.call(job);
    }

    frontSegmentLength = distanceTravelled % window.hg.Grid.config.tileOuterRadius;
    backSegmentLength = (job.lineLength - frontSegmentLength +
        window.hg.Grid.config.tileOuterRadius) % window.hg.Grid.config.tileOuterRadius;

    job.frontSegmentEndRatio = frontSegmentLength / window.hg.Grid.config.tileOuterRadius;
    job.backSegmentStartRatio = 1 - (backSegmentLength / window.hg.Grid.config.tileOuterRadius);

    job.isShort = job.lineLength < window.hg.Grid.config.tileOuterRadius;
    job.isStarting = distanceTravelled < job.lineLength;

    // Check whether the line has reached the edge
    if (job.hasAlmostReachedEdge && segmentsTouchedCount >= job.corners.length) {
      job.hasReachedEdge = true;
    }

    // --- Determine how many segments are included in the polyline --- //

    // When the polyline is neither starting nor ending and is not shorter than the length of a
    // segment, then this is how many segments it includes
    job.segmentsIncludedCount = parseInt((job.lineLength - frontSegmentLength -
        backSegmentLength - config.epsilon) / window.hg.Grid.config.tileOuterRadius) + 2;

    // Subtract from the number of included segments depending on current conditions
    if (job.isShort) {
      // The polyline is shorter than a tile side

      if (job.isStarting || job.hasReachedEdge) {
        // One end of the polyline would lie outside the grid
        job.segmentsIncludedCount = 1;
      } else {
        if (frontSegmentLength - job.lineLength >= 0) {
          // The polyline is between corners
          job.segmentsIncludedCount = 1;
        } else {
          // The polyline is across a corner
          job.segmentsIncludedCount = 2;
        }
      }
    } else {
      // The polyline is longer than a tile side

      if (job.isStarting) {
        // The polyline is starting; the back of the polyline would lie outside the grid
        job.segmentsIncludedCount = segmentsTouchedCount;
      }

      if (job.hasReachedEdge) {
        // The polyline is ending; the front of the polyline would lie outside the grid
        segmentsPastEdgeCount = segmentsTouchedCount - job.corners.length + 1;
        distancePastEdge = distanceTravelled - (job.corners.length - 1) *
            window.hg.Grid.config.tileOuterRadius;

        if (distancePastEdge > job.lineLength) {
          handleCompletion.call(job);
        }

        job.segmentsIncludedCount -= segmentsPastEdgeCount;
      }
    }
  }


  /**
   * Calculates the points in the middle of the gaps between tiles at each known corner.
   *
   * @this LineJob
   */
  function computeCornerGapPoints() {
    var job, i, count;

    job = this;

    job.gapPoints = [];

    for (i = 0, count = job.corners.length; i < count; i += 1) {
      job.gapPoints[i] = computeCornerGapPoint(job.tiles[i], job.corners[i], job.lowerNeighbors[i],
          job.upperNeighbors[i], job.lowerNeighborCorners[i], job.upperNeighborCorners[i]);
    }
  }

  /**
   * Calculates the point in the middle of the gap between tiles at the given corner.
   *
   * @param {Tile} tile
   * @param {Number} corner
   * @param {Object} lowerNeighbor
   * @param {Object} upperNeighbor
   * @param {Number} lowerNeighborCorner
   * @param {Number} upperNeighborCorner
   * @returns {{x:Number,y:Number}}
   */
  function computeCornerGapPoint(tile, corner, lowerNeighbor, upperNeighbor, lowerNeighborCorner,
                             upperNeighborCorner) {
    var count, xSum, ySum;

    if (lowerNeighbor) {
      if (upperNeighbor) {
        count = 3;
        xSum = tile.particle.px + lowerNeighbor.tile.particle.px + upperNeighbor.tile.particle.px;
        ySum = tile.particle.py + lowerNeighbor.tile.particle.py + upperNeighbor.tile.particle.py;
      } else {
        count = 2;
        xSum = tile.vertices[corner * 2] + lowerNeighbor.tile.vertices[lowerNeighborCorner * 2];
        ySum = tile.vertices[corner * 2 + 1] +
            lowerNeighbor.tile.vertices[lowerNeighborCorner * 2 + 1];
      }
    } else {
      if (upperNeighbor) {
        count = 2;
        xSum = tile.vertices[corner * 2] + upperNeighbor.tile.vertices[upperNeighborCorner * 2];
        ySum = tile.vertices[corner * 2 + 1] +
            upperNeighbor.tile.vertices[upperNeighborCorner * 2 + 1];
      } else {
        count = 1;
        xSum = tile.vertices[corner * 2];
        ySum = tile.vertices[corner * 2 + 1];
      }
    }

    return {
      x: xSum / count,
      y: ySum / count
    };
  }

  /**
   * Calculates the points of the SVG polyline element.
   *
   * @this LineJob
   */
  function computePolylinePoints() {
    var job, gapPointsIndex, polylinePointsIndex, stopIndex;

    job = this;

    job.polylinePoints = [];
    gapPointsIndex = job.currentCornerIndex;

    if (job.extraStartPoint && job.isStarting) {
      // Add the extra, forced initial point (this is useful for making radiating lines actually
      // start from the center of the tile and not show any gap around the corners of the tile)
      job.polylinePoints[0] = job.extraStartPoint;

      polylinePointsIndex = job.segmentsIncludedCount + 1;
      stopIndex = 1;
    } else {
      polylinePointsIndex = job.segmentsIncludedCount;
      stopIndex = 0;
    }

    // Add the front-end segment point
    if (!job.hasReachedEdge) {
      job.polylinePoints[polylinePointsIndex] = {
        x: job.gapPoints[gapPointsIndex].x * job.frontSegmentEndRatio +
            job.gapPoints[gapPointsIndex - 1].x * (1 - job.frontSegmentEndRatio),
        y: job.gapPoints[gapPointsIndex].y * job.frontSegmentEndRatio +
            job.gapPoints[gapPointsIndex - 1].y * (1 - job.frontSegmentEndRatio)
      };
    } else {
      job.polylinePoints[polylinePointsIndex] = {
        x: job.gapPoints[gapPointsIndex].x,
        y: job.gapPoints[gapPointsIndex].y
      };
    }

    polylinePointsIndex -= 1;
    gapPointsIndex -= 1;

    // Add the internal segment points
    for (; polylinePointsIndex > stopIndex; polylinePointsIndex -= 1, gapPointsIndex -= 1) {
      job.polylinePoints[polylinePointsIndex] = job.gapPoints[gapPointsIndex];
    }

    // Add the back-end segment point
    if (!job.isStarting) {
      job.polylinePoints[polylinePointsIndex] = {
        x: job.gapPoints[gapPointsIndex + 1].x * job.backSegmentStartRatio +
            job.gapPoints[gapPointsIndex].x * (1 - job.backSegmentStartRatio),
        y: job.gapPoints[gapPointsIndex + 1].y * job.backSegmentStartRatio +
            job.gapPoints[gapPointsIndex].y * (1 - job.backSegmentStartRatio)
      }
    } else {
      job.polylinePoints[polylinePointsIndex] = {
        x: job.gapPoints[gapPointsIndex].x,
        y: job.gapPoints[gapPointsIndex].y
      };
    }
  }

  /**
   * Updates the actual SVG elements to render the current state of this animation.
   *
   * @this LineJob
   */
  function drawSegments() {
    var job, i, count, pointsString;

    job = this;

    // Create the points string
    pointsString = '';
    for (i = 0, count = job.polylinePoints.length; i < count; i += 1) {
      pointsString += job.polylinePoints[i].x + ',' + job.polylinePoints[i].y + ' ';
    }

    // Update the attributes of the polyline SVG element
    job.polyline.setAttribute('points', pointsString);
    job.polyline.setAttribute('stroke', 'hsl(' + job.currentColor.h + ',' + job.currentColor.s +
        '%,' + job.currentColor.l + '%)');
    job.polyline.setAttribute('stroke-opacity', job.currentOpacity);
    job.polyline.setAttribute('stroke-width', job.lineWidth);
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this LineJob as started.
   *
   * @this LineJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this LineJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this LineJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function updateWithBlur(currentTime, deltaTime) {
    var job = this;

    job.ellapsedTime = currentTime - job.startTime;

    if (job.ellapsedTime >= job.duration) {
      handleCompletion.call(job);
    } else {
      updateColorValues.call(job);
      updateSegments.call(job);

      config.feGaussianBlur.setAttribute('stdDeviation', job.blurStdDeviation);

      if (!job.isComplete) {
        computeCornerGapPoints.call(job);
        computePolylinePoints.call(job);
      }
    }
  }
  function updateWithOutBlur(currentTime, deltaTime) {
    var job = this;

    job.ellapsedTime = currentTime - job.startTime;

    if (job.ellapsedTime >= job.duration) {
      handleCompletion.call(job);
    } else {
      updateColorValues.call(job);
      updateSegments.call(job);

      if (!job.isComplete) {
        computeCornerGapPoints.call(job);
        computePolylinePoints.call(job);
      }
    }
  }

  /**
   * Draws the current state of this LineJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this LineJob
   */
  function draw() {
    var job = this;

    drawSegments.call(job);
  }

  /**
   * Stops this LineJob, and returns the element its original form.
   *
   * @this LineJob
   */
  function cancel() {
    var job;

    job = this;

    handleCompletion.call(job);
  }

  /**
   * @this LineJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Number} corner
   * @param {Number} direction
   * @param {Number} forcedInitialRelativeDirection
   * @param {Function} [onComplete]
   * @param {{x:Number,y:Number}} extraStartPoint
   * @throws {Error}
   */
  function LineJob(grid, tile, corner, direction, forcedInitialRelativeDirection,
                            onComplete, extraStartPoint) {
    var job = this;

    job.grid = grid;
    job.tiles = [tile];
    job.corners = [corner];
    job.lowerNeighbors = [];
    job.upperNeighbors = [];
    job.lowerNeighborCorners = [];
    job.upperNeighborCorners = [];
    job.direction = direction;
    job.forcedInitialRelativeDirection = forcedInitialRelativeDirection;
    job.extraStartPoint = extraStartPoint;
    job.currentCornerIndex = 0;
    job.frontSegmentEndRatio = Number.NaN;
    job.backSegmentStartRatio = Number.NaN;
    job.latestDirection = direction;
    job.polyline = null;
    job.gapPoints = [];
    job.polylinePoints = null;
    job.hasReachedEdge = false;
    job.startTime = 0;
    job.ellapsedTime = 0;
    job.isComplete = true;

    job.startHue = Number.NaN;
    job.endHue = Number.NaN;
    job.currentColor = {
      h: Number.NaN,
      s: config.startSaturation,
      l: config.startLightness
    };
    job.currentOpacity = config.startOpacity;

    job.duration = config.duration;
    job.lineWidth = config.lineWidth;
    job.lineLength = config.lineLength;
    job.lineSidePeriod = config.lineSidePeriod;

    job.startSaturation = config.startSaturation;
    job.startLightness = config.startLightness;
    job.startOpacity = config.startOpacity;

    job.endSaturation = config.endSaturation;
    job.endLightness = config.endLightness;
    job.endOpacity = config.endOpacity;

    job.sameDirectionProb = config.sameDirectionProb;

    job.blurStdDeviation = config.blurStdDeviation;
    job.isBlurOn = config.isBlurOn;

    job.onComplete = onComplete || function () {};

    job.start = start;
    job.update = job.isBlurOn ? updateWithBlur : updateWithOutBlur;
    job.draw = draw;
    job.cancel = cancel;
    job.init = init;

    if (!config.haveDefinedLineBlur) {
      config.haveDefinedLineBlur = true;
      defineLineBlur.call(job);
    }

    if (!checkIsValidInitialCornerConfiguration(job)) {
      throw new Error('LineJob created with invalid initial corner configuration: ' +
          'tileIndex=' + tile.originalIndex + ', corner=' + corner + ', direction=' + direction);
    } else {
      determineNeighbors.call(job);
      createHues.call(job);
      createPolyline.call(job);

      console.log('LineJob created: tileIndex=' + tile.originalIndex + ', corner=' + corner +
          ', direction=' + direction);
    }
  }

  /**
   * Creates a LineJob that is initialized at a tile vertex along the border of the grid.
   *
   * @param {Grid} grid
   * @param {Function} onComplete
   */
  function createRandomLineJob(grid, onComplete) {
    var tile, corner, direction, forcedInitialRelativeDirection;

    // Pick a random, non-corner, border tile to start from
    do {
      tile = grid.originalBorderTiles[parseInt(Math.random() * grid.originalBorderTiles.length)];
    } while (tile.isCornerTile);

    // Determine which corner and direction to use based on the selected tile
    if (grid.isVertical) {
      if (!tile.neighborStates[4]) { // Left side
        if (tile.isInLargerRow) {
          if (Math.random() < 0.5) {
            corner = 0;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 2;
          } else {
            corner = 3;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 1;
          }
        } else { // Smaller row
          if (Math.random() < 0.5) {
            corner = 4;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 2;
          } else {
            corner = 5;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 1;
          }
        }
        direction = tile.originalAnchor.y < grid.originalCenter.y ? 2 : 1;
      } else if (!tile.neighborStates[1]) { // Right side
        if (tile.isInLargerRow) {
          if (Math.random() < 0.5) {
            corner = 0;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 4;
          } else {
            corner = 3;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 5;
          }
        } else { // Smaller row
          if (Math.random() < 0.5) {
            corner = 1;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 5;
          } else {
            corner = 2;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 4;
          }
        }
        direction = tile.originalAnchor.y < grid.originalCenter.y ? 4 : 5;
      } else if (!tile.neighborStates[0]) { // Top side
        if (Math.random() < 0.5) {
          corner = 1;
          forcedInitialRelativeDirection = config.UPPER_SELF;
        } else {
          corner = 5;
          forcedInitialRelativeDirection = config.LOWER_SELF;
        }
        //forcedInitialAbsoluteDirection = 3;
        direction = 3;
      } else { // Bottom side
        if (Math.random() < 0.5) {
          corner = 2;
          forcedInitialRelativeDirection = config.LOWER_SELF;
        } else {
          corner = 4;
          forcedInitialRelativeDirection = config.UPPER_SELF;
        }
        //forcedInitialAbsoluteDirection = 0;
        direction = 0;
      }
    } else { // Not vertical
      if (!tile.neighborStates[0]) { // Top side
        if (tile.rowIndex === 0) { // First row
          if (Math.random() < 0.5) {
            corner = 1;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 3;
          } else {
            corner = 4;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 2;
          }
        } else { // Second row
          if (Math.random() < 0.5) {
            corner = 0;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 2;
          } else {
            corner = 5;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 3;
          }
        }
        direction = tile.originalAnchor.x < grid.originalCenter.x ? 2 : 3;
      } else if (!tile.neighborStates[3]) { // Bottom side
        if (tile.rowIndex === grid.rowCount - 1) { // Last row
          if (Math.random() < 0.5) {
            corner = 1;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 5;
          } else {
            corner = 4;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 0;
          }
        } else { // Second-to-last row
          if (Math.random() < 0.5) {
            corner = 2;
            forcedInitialRelativeDirection = config.LOWER_SELF;
            //forcedInitialAbsoluteDirection = 0;
          } else {
            corner = 3;
            forcedInitialRelativeDirection = config.UPPER_SELF;
            //forcedInitialAbsoluteDirection = 5;
          }
        }
        direction = tile.originalAnchor.x < grid.originalCenter.x ? 0 : 5;
      } else if (!tile.neighborStates[4]) { // Left side
        if (Math.random() < 0.5) {
          corner = 3;
          forcedInitialRelativeDirection = config.LOWER_SELF;
        } else {
          corner = 5;
          forcedInitialRelativeDirection = config.UPPER_SELF;
        }
        //forcedInitialAbsoluteDirection = 1;
        direction = 1;
      } else { // Right side
        if (Math.random() < 0.5) {
          corner = 0;
          forcedInitialRelativeDirection = config.LOWER_SELF;
        } else {
          corner = 2;
          forcedInitialRelativeDirection = config.UPPER_SELF;
        }
        //forcedInitialAbsoluteDirection = 4;
        direction = 4;
      }
    }

    return new LineJob(grid, tile, corner, direction, forcedInitialRelativeDirection,
        onComplete, null);
  }

  /**
   * Checks whether the given LineJob has a valid corner configuration for its initial
   * position.
   *
   * @param {LineJob} job
   */
  function checkIsValidInitialCornerConfiguration(job) {
    var tile, corner, direction, forcedInitialRelativeDirection, isValidEdgeDirection;

    tile = job.tiles[0];
    corner = job.corners[0];
    direction = job.direction;
    forcedInitialRelativeDirection = job.forcedInitialRelativeDirection;

    if (tile.isCornerTile) {
      return false;
    }

    if (tile.isBorderTile) {
      if (job.grid.isVertical) {
        if (!tile.neighborStates[4]) { // Left side
          isValidEdgeDirection = direction === 1 || direction === 2;

          if (tile.isInLargerRow) {
            switch (corner) {
              case 0:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
              case 1:
                return true;
              case 2:
                return true;
              case 3:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
              case 4:
                return false;
              case 5:
                return false;
            }
          } else {
            switch (corner) {
              case 0:
                return true;
              case 1:
                return true;
              case 2:
                return true;
              case 3:
                return true;
              case 4:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
              case 5:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
            }
          }
        } else if (!tile.neighborStates[1]) { // Right side
          isValidEdgeDirection = direction === 4 || direction === 5;

          if (tile.isInLargerRow) {
            switch (corner) {
              case 0:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
              case 1:
                return false;
              case 2:
                return false;
              case 3:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
              case 4:
                return true;
              case 5:
                return true;
            }
          } else { // Smaller row
            switch (corner) {
              case 0:
                return true;
              case 1:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
              case 2:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
              case 3:
                return true;
              case 4:
                return true;
              case 5:
                return true;
            }
          }
        } else if (!tile.neighborStates[0]) { // Top side
          isValidEdgeDirection = direction === 3;

          switch (corner) {
            case 0:
              return false;
            case 1:
              return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
            case 2:
              return true;
            case 3:
              return true;
            case 4:
              return true;
            case 5:
              return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
          }
        } else { // Bottom side
          isValidEdgeDirection = direction === 0;

          switch (corner) {
            case 0:
              return true;
            case 1:
              return true;
            case 2:
              return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
            case 3:
              return false;
            case 4:
              return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
            case 5:
              return true;
          }
        }
      } else { // Not vertical
        if (!tile.neighborStates[0]) { // Top side
          isValidEdgeDirection = direction === 2 || direction === 3;

          if (tile.rowIndex === 0) { // First row
            switch (corner) {
              case 0:
                return false;
              case 1:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
              case 2:
                return true;
              case 3:
                return true;
              case 4:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
              case 5:
                return false;
            }
          } else { // Second row
            switch (corner) {
              case 0:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
              case 1:
                return true;
              case 2:
                return true;
              case 3:
                return true;
              case 4:
                return true;
              case 5:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
            }
          }
        } else if (!tile.neighborStates[3]) { // Bottom side
          isValidEdgeDirection = direction === 0 || direction === 5;

          if (tile.rowIndex === job.grid.rowCount - 1) { // Last row
            switch (corner) {
              case 0:
                return true;
              case 1:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
              case 2:
                return false;
              case 3:
                return false;
              case 4:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
              case 5:
                return true;
            }
          } else { // Second-to-last row
            switch (corner) {
              case 0:
                return true;
              case 1:
                return true;
              case 2:
                return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
              case 3:
                return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
              case 4:
                return true;
              case 5:
                return true;
            }
          }
        } else if (!tile.neighborStates[4]) { // Left side
          isValidEdgeDirection = direction === 1;

          switch (corner) {
            case 0:
              return true;
            case 1:
              return true;
            case 2:
              return true;
            case 3:
              return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
            case 4:
              return false;
            case 5:
              return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
          }
        } else { // Right side
          isValidEdgeDirection = direction === 4;

          switch (corner) {
            case 0:
              return forcedInitialRelativeDirection === config.LOWER_SELF && isValidEdgeDirection;
            case 1:
              return false;
            case 2:
              return forcedInitialRelativeDirection === config.UPPER_SELF && isValidEdgeDirection;
            case 3:
              return true;
            case 4:
              return true;
            case 5:
              return true;
          }
        }
      }
    }

    return true;
  }

  LineJob.config = config;
  LineJob.createRandomLineJob = createRandomLineJob;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.LineJob = LineJob;

  console.log('LineJob module loaded');
})();

/**
 * @typedef {AnimationJob} LinesRadiateJob
 */

/**
 * This module defines a constructor for LinesRadiateJob objects.
 *
 * @module LinesRadiateJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 700;
  config.lineWidth = 24;
  config.lineLength = 1300;
  config.lineSidePeriod = 30; // milliseconds per tile side

  config.startSaturation = 100;
  config.startLightness = 100;
  config.startOpacity = 0.8;

  config.endSaturation = 100;
  config.endLightness = 70;
  config.endOpacity = 0;

  config.sameDirectionProb = 0.85;

  config.blurStdDeviation = 2;
  config.isBlurOn = false;

  config.isRecurring = false;
  config.avgDelay = 2000;
  config.delayDeviationRange = 1800;

  // ---  --- //

  config.haveDefinedLineBlur = false;
  config.filterId = 'random-line-filter';

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Creates an SVG definition that is used for blurring the lines of LineJobs.
   *
   * @this LinesRadiateJob
   */
  function defineLineBlur() {
    var job, filter, feGaussianBlur;

    job = this;

    // Create the elements

    filter = document.createElementNS(window.hg.util.svgNamespace, 'filter');
    job.grid.svgDefs.appendChild(filter);

    feGaussianBlur = document.createElementNS(window.hg.util.svgNamespace, 'feGaussianBlur');
    filter.appendChild(feGaussianBlur);

    // Define the blur

    filter.setAttribute('id', config.filterId);
    filter.setAttribute('x', '-10%');
    filter.setAttribute('y', '-10%');
    filter.setAttribute('width', '120%');
    filter.setAttribute('height', '120%');

    feGaussianBlur.setAttribute('in', 'SourceGraphic');
    feGaussianBlur.setAttribute('result', 'blurOut');

    job.feGaussianBlur = feGaussianBlur;
  }

  /**
   * Creates the individual LineJobs that comprise this LinesRadiateJob.
   *
   * @this LinesRadiateJob
   */
  function createLineJobs() {
    var job, i, line;

    job = this;
    job.lineJobs = [];

    for (i = 0; i < 6; i += 1) {
      try {
        line = new window.hg.LineJob(job.grid, job.tile, i, i,
            window.hg.LineJob.config.NEIGHBOR, job.onComplete, job.extraStartPoint);
      } catch (error) {
        console.debug(error.message);
        continue;
      }

      job.lineJobs.push(line);

      // Replace the line animation's normal parameters with some that are specific to radiating
      // lines
      line.duration = config.duration;
      line.lineWidth = config.lineWidth;
      line.lineLength = config.lineLength;
      line.lineSidePeriod = config.lineSidePeriod;

      line.startSaturation = config.startSaturation;
      line.startLightness = config.startLightness;
      line.startOpacity = config.startOpacity;

      line.endSaturation = config.endSaturation;
      line.endLightness = config.endLightness;
      line.endOpacity = config.endOpacity;

      line.sameDirectionProb = config.sameDirectionProb;

      line.filterId = config.filterId;
      line.blurStdDeviation = config.blurStdDeviation;
      line.isBlurOn = config.isBlurOn;

      if (config.isBlurOn) {
        line.polyline.setAttribute('filter', 'url(#' + config.filterId + ')');
      } else {
        line.polyline.setAttribute('filter', 'none');
      }
    }
  }

  /**
   * Checks whether this job is complete. If so, a flag is set and a callback is called.
   *
   * @this LinesRadiateJob
   */
  function checkForComplete() {
    var job, i;

    job = this;

    for (i = 0; i < job.lineJobs.length; i += 1) {
      if (job.lineJobs[i].isComplete) {
        job.lineJobs.splice(i--, 1);
      } else {
        return;
      }
    }

    console.log('LinesRadiateJob completed');

    job.isComplete = true;
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this LinesRadiateJob as started.
   *
   * @this LinesRadiateJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job, i, count;

    job = this;

    job.startTime = startTime;
    job.isComplete = false;

    for (i = 0, count = job.lineJobs.length; i < count; i += 1) {
      job.lineJobs[i].start(startTime);
    }
  }

  /**
   * Updates the animation progress of this LinesRadiateJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this LinesRadiateJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, i, count;

    job = this;

    // Update the extra point
    job.extraStartPoint.x = job.tile.particle.px;
    job.extraStartPoint.y = job.tile.particle.py;

    for (i = 0, count = job.lineJobs.length; i < count; i += 1) {
      job.lineJobs[i].update(currentTime, deltaTime);

      if (job.lineJobs[i].isComplete) {
        job.lineJobs.splice(i, 1);
        i--;
        count--;
      }
    }

    job.feGaussianBlur.setAttribute('stdDeviation', config.blurStdDeviation);

    checkForComplete.call(job);
  }

  /**
   * Draws the current state of this LinesRadiateJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this LinesRadiateJob
   */
  function draw() {
    var job, i, count;

    job = this;

    for (i = 0, count = job.lineJobs.length; i < count; i += 1) {
      job.lineJobs[i].draw();
    }
  }

  /**
   * Stops this LinesRadiateJob, and returns the element its original form.
   *
   * @this LinesRadiateJob
   */
  function cancel() {
    var job, i, count;

    job = this;

    for (i = 0, count = job.lineJobs.length; i < count; i += 1) {
      job.lineJobs[i].cancel();
    }

    job.lineJobs = [];

    job.isComplete = true;
  }

  /**
   * @this LinesRadiateJob
   */
  function init() {
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} [onComplete]
   */
  function LinesRadiateJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.tile = tile;
    job.extraStartPoint = { x: tile.particle.px, y: tile.particle.py };
    job.startTime = 0;
    job.isComplete = true;
    job.lineJobs = null;

    job.onComplete = onComplete || function () {};

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.init = init;

    if (!config.haveDefinedLineBlur) {
      defineLineBlur.call(job);
    }

    createLineJobs.call(job);

    console.log('LinesRadiateJob created: tileIndex=' + tile.originalIndex);
  }

  LinesRadiateJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.LinesRadiateJob = LinesRadiateJob;

  console.log('LinesRadiateJob module loaded');
})();

/**
 * @typedef {AnimationJob} OpenPostJob
 */

/**
 * This module defines a constructor for OpenPostJob objects.
 *
 * @module OpenPostJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;

  config.expandedDisplacementTileCount = 3;

  config.spreadDurationOffset = -200;
  config.panDurationOffset = -100;
  config.fadePostDurationOffset = 1100;
  config.dilateSectorsDurationOffset = 0;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this OpenPostJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('OpenPostJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.grid.isTransitioning = false;

    // Don't reset some state if another expansion job started after this one did
    if (job.grid.lastExpansionJob === job) {
      job.grid.pagePost.loadCarouselMedia();
    }

    job.isComplete = true;
    job.onComplete();
  }

  /**
   * Creates the Sectors for expanding the grid.
   *
   * @this OpenPostJob
   */
  function createSectors() {
    var job, i, j, jCount, k, sectorTiles, allExpandedTiles;

    job = this;

    // Create the sectors
    for (i = 0; i < 6; i += 1) {
      job.sectors[i] = new window.hg.Sector(job.grid, job.baseTile, i,
          config.expandedDisplacementTileCount);
    }

    // Connect the sectors' tiles' external neighbor states
    for (i = 0; i < 6; i += 1) {
      job.sectors[i].initializeExpandedStateExternalTileNeighbors(job.sectors);
    }

//    dumpSectorInfo.call(job);

    // De-allocate the now-unnecessary two-dimensional sector tile collections
    for (i = 0; i < 6; i += 1) {
      job.sectors[i].tilesByIndex = null;
    }

    // Set up the expanded state for the selected tile (which is a member of no sector)
    window.hg.Tile.initializeTileExpandedState(job.baseTile, null, Number.NaN, Number.NaN);

    job.grid.sectors = job.sectors;

    // Give the grid a reference to the new complete collection of all tiles
    allExpandedTiles = [];
    for (k = 0, i = 0; i < 6; i += 1) {
      sectorTiles = job.sectors[i].tiles;

      for (j = 0, jCount = sectorTiles.length; j < jCount; j += 1, k += 1) {
        allExpandedTiles[k] = sectorTiles[j];
      }
    }
    allExpandedTiles[k] = job.baseTile;
    job.grid.updateAllTilesCollection(allExpandedTiles);
  }

  /**
   * Logs the new Sector data.
   *
   * @this OpenPostJob
   */
  function dumpSectorInfo() {
    var job, i;

    job = this;

    for (i = 0; i < 6; i += 1) {
      console.log(job.sectors[i]);
    }
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this OpenPostJob as started.
   *
   * @this OpenPostJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var panDisplacement;
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;

    if (job.grid.isTransitioning) {
      job.previousJob.cancel();
    }

    job.grid.isPostOpen = true;
    job.grid.isTransitioning = true;
    job.grid.expandedTile = job.baseTile;
    job.grid.lastExpansionJob = job;

    // Turn scrolling off while the grid is expanded
    job.grid.parent.style.overflow = 'hidden';

    createSectors.call(job);

    job.grid.annotations.setExpandedAnnotations(true);

    // Start the sub-jobs
    window.hg.controller.transientJobs.SpreadJob.create(job.grid, job.baseTile)
        .duration = config.duration + config.spreadDurationOffset;
    window.hg.controller.transientJobs.PanJob.create(job.grid, job.baseTile)
        .duration = config.duration + config.panDurationOffset;

    panDisplacement = {
      x: job.grid.panCenter.x - job.grid.originalCenter.x,
      y: job.grid.panCenter.y - job.grid.originalCenter.y
    };

    window.hg.controller.transientJobs.DilateSectorsJob.create(job.grid, job.baseTile, panDisplacement)
        .duration = config.duration + config.dilateSectorsDurationOffset;
    window.hg.controller.transientJobs.FadePostJob.create(job.grid, job.baseTile)
        .duration = config.duration + config.fadePostDurationOffset;

    // TODO: this should instead fade out the old persistent animations and fade in the new ones
    window.hg.controller.resetPersistentJobs(job.grid);
  }

  /**
   * Updates the animation progress of this OpenPostJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this OpenPostJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job = this;

    // Is the job done?
    if (currentTime - job.startTime >= config.duration) {
      handleComplete.call(job, false);
    }
  }

  /**
   * Draws the current state of this OpenPostJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this OpenPostJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this OpenPostJob, and returns the element its original form.
   *
   * @this OpenPostJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this OpenPostJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function OpenPostJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.baseTile = tile;
    job.startTime = 0;
    job.isComplete = true;
    job.sectors = [];
    job.previousJob = grid.lastExpansionJob;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('OpenPostJob created: tileIndex=' + job.baseTile.originalIndex);
  }

  OpenPostJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.OpenPostJob = OpenPostJob;

  console.log('OpenPostJob module loaded');
})();

/**
 * @typedef {AnimationJob} PanJob
 */

/**
 * This module defines a constructor for PanJob objects.
 *
 * @module PanJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 400;

  config.displacementRatio = 0.28;

  config.isRecurring = false;
  config.avgDelay = 300;
  config.delayDeviationRange = 0;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this PanJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('PanJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;

    job.onComplete();
  }

  /**
   * @this PanJob
   */
  function setFinalPositions() {
    var job, i, count;

    job = this;

    // Displace the tiles
    for (i = 0, count = job.grid.allTiles.length; i < count; i += 1) {
      job.grid.allTiles[i].originalAnchor.x += job.displacement.x;
      job.grid.allTiles[i].originalAnchor.y += job.displacement.y;
    }

    // Update the grid
    job.grid.panCenter.x += job.displacement.x;
    job.grid.panCenter.y += job.displacement.y;
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this PanJob as started.
   *
   * @this PanJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.reverseDisplacement = {x: job.endPoint.x - job.startPoint.x, y: job.endPoint.y - job.startPoint.y};
    job.displacement = {x: -job.reverseDisplacement.x, y: -job.reverseDisplacement.y};

    job.startTime = startTime;
    job.isComplete = false;

    // Set the final positions at the start, and animate everything in "reverse"
    setFinalPositions.call(job);
  }

  /**
   * Updates the animation progress of this PanJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this PanJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, progress, i, count, displacementX, displacementY;

    job = this;

    // Calculate progress with an easing function
    // Because the final positions were set at the start, the progress needs to update in "reverse"
    progress = (currentTime - job.startTime) / job.duration;
    progress = 1 - window.hg.util.easingFunctions.easeOutQuint(progress);
    progress = progress < 0 ? 0 : progress;

    displacementX = job.reverseDisplacement.x * progress;
    displacementY = job.reverseDisplacement.y * progress;

    // Displace the tiles
    for (i = 0, count = job.grid.allTiles.length; i < count; i += 1) {
      job.grid.allTiles[i].currentAnchor.x += displacementX;
      job.grid.allTiles[i].currentAnchor.y += displacementY;
    }

    // Update the grid
    job.grid.currentCenter.x = job.grid.panCenter.x + displacementX;
    job.grid.currentCenter.y = job.grid.panCenter.y + displacementY;

    // Is the job done?
    if (progress === 0) {
      handleComplete.call(job, false);
    }
  }

  /**
   * Draws the current state of this PanJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this PanJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this PanJob, and returns the element its original form.
   *
   * @this PanJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this PanJob
   */
  function init() {
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {?Tile} tile
   * @param {Function} onComplete
   * @param {{x:Number,y:Number}} [destinationPoint]
   */
  function PanJob(grid, tile, onComplete, destinationPoint) {
    var job = this;

    job.grid = grid;
    job.baseTile = tile;
    job.reverseDisplacement = null;
    job.displacement = null;
    job.startTime = 0;
    job.isComplete = true;

    grid.scrollTop = grid.parent.scrollTop;

    // The current viewport coordinates of the point that we would like to move to the center of the viewport
    job.endPoint = destinationPoint || {
      x: tile.originalAnchor.x,
      y: tile.originalAnchor.y - grid.scrollTop
    };

    // The center of the viewport
    job.startPoint = {x: grid.originalCenter.x, y: grid.originalCenter.y};

    job.duration = config.duration;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('PanJob created: tileIndex=' + job.baseTile.originalIndex);
  }

  PanJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.PanJob = PanJob;

  console.log('PanJob module loaded');
})();

/**
 * @typedef {AnimationJob} SpreadJob
 */

/**
 * This module defines a constructor for SpreadJob objects.
 *
 * @module SpreadJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 300;

  config.displacementRatio = 0.2;

  config.isRecurring = false;
  config.avgDelay = 4000;
  config.delayDeviationRange = 3800;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * Calculates and stores the maximal displacement values for all tiles.
   *
   * @this SpreadJob
   */
  function initializeDisplacements() {
    var job, i, count;

    job = this;

    job.displacements = [];

    for (i = 0, count = job.grid.allTiles.length; i < count; i += 1) {
      job.displacements[i] = {
        tile: job.grid.allTiles[i],
        dx: config.displacementRatio *
            (job.grid.allTiles[i].originalAnchor.x - job.baseTile.originalAnchor.x),
        dy: config.displacementRatio *
            (job.grid.allTiles[i].originalAnchor.y - job.baseTile.originalAnchor.y)
      };
    }
  }

  /**
   * @this SpreadJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('SpreadJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;

    job.onComplete();
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this SpreadJob as started.
   *
   * @this SpreadJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this SpreadJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this SpreadJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    var job, progress, i, count;

    job = this;

    if (currentTime > job.startTime + job.duration) {
      handleComplete.call(job, false);
    } else {
      // Ease-out halfway, then ease-in back
      progress = (currentTime - job.startTime) / job.duration;
      progress = (progress > 0.5 ? 1 - progress : progress) * 2;
      progress = window.hg.util.easingFunctions.easeOutQuint(progress);

      // Displace the tiles
      for (i = 0, count = job.displacements.length; i < count; i += 1) {
        job.displacements[i].tile.currentAnchor.x += job.displacements[i].dx * progress;
        job.displacements[i].tile.currentAnchor.y += job.displacements[i].dy * progress;
      }
    }
  }

  /**
   * Draws the current state of this SpreadJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this SpreadJob
   */
  function draw() {
    // This animation job updates the state of actual tiles, so it has nothing of its own to draw
  }

  /**
   * Stops this SpreadJob, and returns the element its original form.
   *
   * @this SpreadJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this SpreadJob
   */
  function init() {
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function SpreadJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.baseTile = tile;
    job.startTime = 0;
    job.isComplete = true;

    job.displacements = null;

    job.duration = config.duration;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    initializeDisplacements.call(job);

    console.log('SpreadJob created: tileIndex=' + job.baseTile.originalIndex);
  }

  SpreadJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.SpreadJob = SpreadJob;

  console.log('SpreadJob module loaded');
})();

/**
 * @typedef {AnimationJob} TileBorderJob
 */

/**
 * This module defines a constructor for TileBorderJob objects.
 *
 * @module TileBorderJob
 */
(function () {
  // ------------------------------------------------------------------------------------------- //
  // Private static variables

  var config = {};

  config.duration = 500;

  // TODO:

  config.isRecurring = false;
  config.avgDelay = 4000;
  config.delayDeviationRange = 3800;

  //  --- Dependent parameters --- //

  config.computeDependentValues = function () {
    // TODO:
  };

  config.computeDependentValues();

  // ------------------------------------------------------------------------------------------- //
  // Private dynamic functions

  /**
   * @this TileBorderJob
   */
  function handleComplete(wasCancelled) {
    var job = this;

    console.log('TileBorderJob ' + (wasCancelled ? 'cancelled' : 'completed'));

    job.isComplete = true;

    job.onComplete();
  }

  // ------------------------------------------------------------------------------------------- //
  // Private static functions

  // ------------------------------------------------------------------------------------------- //
  // Public dynamic functions

  /**
   * Sets this TileBorderJob as started.
   *
   * @this TileBorderJob
   * @param {Number} startTime
   */
  function start(startTime) {
    var job = this;

    job.startTime = startTime;
    job.isComplete = false;
  }

  /**
   * Updates the animation progress of this TileBorderJob to match the given time.
   *
   * This should be called from the overall animation loop.
   *
   * @this TileBorderJob
   * @param {Number} currentTime
   * @param {Number} deltaTime
   */
  function update(currentTime, deltaTime) {
    // TODO:
//    var job, currentMaxDistance, currentMinDistance, i, count, distance, waveWidthRatio,
//        oneMinusDurationRatio, animatedSomeTile;
//
//    job = this;
//
//    if (currentTime > job.startTime + config.duration) {
//      handleComplete.call(job, false);
//    } else {
//      oneMinusDurationRatio = 1 - (currentTime - job.startTime) / config.duration;
//
//      currentMaxDistance = config.shimmerSpeed * (currentTime - job.startTime);
//      currentMinDistance = currentMaxDistance - config.shimmerWaveWidth;
//
//      animatedSomeTile = false;
//
//      for (i = 0, count = job.grid.originalTiles.length; i < count; i += 1) {
//        distance = job.tileDistances[i];
//
//        if (distance > currentMinDistance && distance < currentMaxDistance) {
//          waveWidthRatio = (distance - currentMinDistance) / config.shimmerWaveWidth;
//
//          updateTile(job.grid.originalTiles[i], waveWidthRatio, oneMinusDurationRatio);
//
//          animatedSomeTile = true;
//        }
//      }
//
//      if (!animatedSomeTile) {
//        handleComplete.call(job, false);
//      }
//    }**;
  }

  /**
   * Draws the current state of this TileBorderJob.
   *
   * This should be called from the overall animation loop.
   *
   * @this TileBorderJob
   */
  function draw() {
    var job;

    job = this;

    // TODO:
  }

  /**
   * Stops this TileBorderJob, and returns the element its original form.
   *
   * @this TileBorderJob
   */
  function cancel() {
    var job = this;

    handleComplete.call(job, true);
  }

  /**
   * @this TileBorderJob
   */
  function init() {
    var job = this;

    config.computeDependentValues();
    // TODO:
  }

  // ------------------------------------------------------------------------------------------- //
  // Expose this module's constructor

  /**
   * @constructor
   * @global
   * @param {Grid} grid
   * @param {Tile} tile
   * @param {Function} onComplete
   */
  function TileBorderJob(grid, tile, onComplete) {
    var job = this;

    job.grid = grid;
    job.tile = tile;
    job.startTime = 0;
    job.isComplete = true;

    job.start = start;
    job.update = update;
    job.draw = draw;
    job.cancel = cancel;
    job.onComplete = onComplete;
    job.init = init;

    console.log('TileBorderJob created: tileIndex=' + job.baseTile.originalIndex);
  }

  TileBorderJob.config = config;

  // Expose this module
  window.hg = window.hg || {};
  window.hg.TileBorderJob = TileBorderJob;

  console.log('TileBorderJob module loaded');
})();