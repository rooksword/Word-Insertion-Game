/**
 * Minimal rule-based POS tagger compatible with Penn/pos-js tag codes.
 * Covers the full tag set; used when the full pos-js library is not bundled.
 */
(function (global) {
  var w = function (s) { return s.toLowerCase(); };

  var IN_WORDS = "of in to for with on at by from as into through during before after over between under again behind off up out down about".split(" ");
  var DT_WORDS = "the a an this that these those every each some any no another".split(" ");
  var CC_WORDS = "and but or nor yet so both either neither not only".split(" ");
  var MD_WORDS = "can could will would shall should may might must need dare ought".split(" ");
  var PRP_WORDS = "i you he she it we they me him her us them".split(" ");
  var PP_WORDS = "my your his her its our their".split(" ");
  var RB_WORDS = "not also just only well very too often always never sometimes".split(" ");
  var RP_WORDS = "up off out down on in over away back about through".split(" ");
  var PDT_WORDS = "all both half many such what".split(" ");
  var WDT_WORDS = "which that whatever whichever".split(" ");
  var WP_WORDS = "who whom what which whoever whomever whatever".split(" ");
  var WRB_WORDS = "how when where why whenever wherever".split(" ");
  var UH_WORDS = "oh oops wow hey well ah um uh huh yes no yeah nope".split(" ");
  var TO_WORD = "to";
  var EX_WORD = "there";

  var IN_SET = new Set(IN_WORDS.map(w));
  var DT_SET = new Set(DT_WORDS.map(w));
  var CC_SET = new Set(CC_WORDS.map(w));
  var MD_SET = new Set(MD_WORDS.map(w));
  var PRP_SET = new Set(PRP_WORDS.map(w));
  var PP_SET = new Set(PP_WORDS.map(w));
  var RB_SET = new Set(RB_WORDS.map(w));
  var RP_SET = new Set(RP_WORDS.map(w));
  var PDT_SET = new Set(PDT_WORDS.map(w));
  var WDT_SET = new Set(WDT_WORDS.map(w));
  var WP_SET = new Set(WP_WORDS.map(w));
  var WRB_SET = new Set(WRB_WORDS.map(w));
  var UH_SET = new Set(UH_WORDS.map(w));

  var NNP_WORDS = "edinburgh london paris berlin rome madrid amsterdam brussels dublin scotland england france germany italy spain europe america africa asia china japan india australia canada russia brazil mexico egypt greece turkey israel russia england wales ireland norway sweden denmark finland poland austria switzerland portugal belgium netherlands scotland cambridge oxford york bristol liverpool manchester birmingham leeds glasgow newcastle boston chicago texas california florida georgia virginia washington denver seattle austin dallas houston atlanta phoenix detroit philadelphia smith john james michael david william richard joseph charles thomas mary jennifer linda elizabeth barbara susan jessica sarah kimberly emma".split(" ");
  var NNP_SET = new Set(NNP_WORDS.map(w));
  var VB_WORDS = "run go get make take come see know think want give use find tell work call try ask need feel become leave put mean keep let begin seem help show hear play live believe hold bring happen write provide sit stand lose pay meet include continue set learn change lead understand watch follow stop create speak read allow add spend grow open walk win offer remember love consider appear buy wait serve die send expect build stay fall cut reach kill remain suggest raise pass sell require report decide pull".split(" ");
  var VBD_WORDS = "went ate saw had did made took came gave wrote spoke broke chose drove flew forgot got hid rode ran sang sat threw wore drew grew knew threw bore tore wore was were".split(" ");
  var RBR_WORDS = "faster better harder longer sooner earlier later less more".split(" ");
  var RBS_WORDS = "fastest best hardest longest soonest earliest latest least most".split(" ");
  var VB_SET = new Set(VB_WORDS.map(w));
  var VBD_SET = new Set(VBD_WORDS.map(w));
  var RBR_SET = new Set(RBR_WORDS.map(w));
  var RBS_SET = new Set(RBS_WORDS.map(w));

  function endsWith(s, x) {
    return s.length >= x.length && s.slice(-x.length) === x;
  }

  function tagWord(word) {
    if (!word || typeof word !== "string") return "NN";
    var lower = word.toLowerCase();
    var firstUpper = word.length > 0 && word.charAt(0) === word.charAt(0).toUpperCase();
    if (lower === TO_WORD) return "TO";
    if (lower === EX_WORD) return "EX";
    if (NNP_SET.has(lower)) return "NNP";
    if (firstUpper && word.length > 1) return endsWith(lower, "s") && lower.length > 2 && !endsWith(lower, "ss") ? "NNPS" : "NNP";
    if (IN_SET.has(lower)) return "IN";
    if (DT_SET.has(lower)) return "DT";
    if (CC_SET.has(lower)) return "CC";
    if (MD_SET.has(lower)) return "MD";
    if (PRP_SET.has(lower)) return "PRP";
    if (PP_SET.has(lower)) return "PP$";
    if (RB_SET.has(lower)) return "RB";
    if (RP_SET.has(lower)) return "RP";
    if (PDT_SET.has(lower)) return "PDT";
    if (WDT_SET.has(lower)) return "WDT";
    if (WP_SET.has(lower)) return "WP";
    if (WRB_SET.has(lower)) return "WRB";
    if (UH_SET.has(lower)) return "UH";
    if (/^\d+(\.\d+)?%?$/.test(word) || /^\d+([.,]\d+)*$/.test(word)) return "CD";
    if (RBS_SET.has(lower)) return "RBS";
    if (RBR_SET.has(lower)) return "RBR";
    if (VBD_SET.has(lower)) return "VBD";
    if (VB_SET.has(lower)) return "VB";
    if (endsWith(lower, "ly")) return "RB";
    if (endsWith(lower, "ing")) return "VBG";
    if (endsWith(lower, "ed")) return "VBN";
    if (endsWith(lower, "es") && lower.length > 3) return "VBZ";
    if (endsWith(lower, "s") && lower.length > 2 && lower !== "is" && lower !== "as" && lower !== "us") return "NNS";
    if (endsWith(lower, "al") || endsWith(lower, "ful") || endsWith(lower, "ous") || endsWith(lower, "ive") || endsWith(lower, "able") || endsWith(lower, "ible") || endsWith(lower, "ent") || endsWith(lower, "ant")) return "JJ";
    if (endsWith(lower, "er") && lower.length > 3) return "JJR";
    if (endsWith(lower, "est") && lower.length > 4) return "JJS";
    if (endsWith(lower, "tion") || endsWith(lower, "sion") || endsWith(lower, "ment") || endsWith(lower, "ness") || endsWith(lower, "ity")) return "NN";
    return "NN";
  }

  global.POS_Tagger = {
    tag: function (words) {
      if (typeof words === "string") words = words.split(/\s+/).filter(Boolean);
      return words.map(function (word) { return [word, tagWord(word)]; });
    },
    tagWord: tagWord
  };
})(typeof window !== "undefined" ? window : this);
