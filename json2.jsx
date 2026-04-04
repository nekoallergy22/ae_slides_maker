// json2.jsx - ExtendScript用JSONポリフィル (ES3環境向け)
// JSON.parse と JSON.stringify を提供します

if (typeof JSON === "undefined") {
  JSON = {};
}

if (typeof JSON.parse !== "function") {
  JSON.parse = function (text) {
    // 基本的なセキュリティチェック
    if (/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
      text.replace(/"(\\.|[^"\\])*"/g, ""))) {
      throw new SyntaxError("JSONの解析に失敗しました");
    }
    return eval("(" + text + ")");
  };
}

if (typeof JSON.stringify !== "function") {
  JSON.stringify = function (value) {
    var type = typeof value;
    if (type === "undefined") return undefined;
    if (value === null) return "null";
    if (type === "boolean") return String(value);
    if (type === "number") return isFinite(value) ? String(value) : "null";
    if (type === "string") {
      return '"' + value.replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t") + '"';
    }
    if (type === "object") {
      if (value instanceof Array) {
        var arr = [];
        for (var i = 0; i < value.length; i++) {
          arr.push(JSON.stringify(value[i]));
        }
        return "[" + arr.join(",") + "]";
      }
      var obj = [];
      for (var key in value) {
        if (value.hasOwnProperty(key)) {
          obj.push(JSON.stringify(key) + ":" + JSON.stringify(value[key]));
        }
      }
      return "{" + obj.join(",") + "}";
    }
    return undefined;
  };
}
