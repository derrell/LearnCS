;modjewel.define("weinre/client/WeinreExtraTargetEventsImpl", function(require, exports, module) { var WeinreExtraTargetEventsImpl;

module.exports = WeinreExtraTargetEventsImpl = (function() {

  function WeinreExtraTargetEventsImpl() {}

  WeinreExtraTargetEventsImpl.prototype.databaseOpened = function(databaseRecord) {
    return WeinreExtraTargetEventsImpl.addDatabaseRecords([databaseRecord]);
  };

  WeinreExtraTargetEventsImpl.addDatabaseRecords = function(databaseRecords) {
    var database, databaseRecord, existingDb, existingDbNames, existingDbs, _i, _j, _len, _len2, _results;
    if (!WebInspector.panels) return;
    if (!WebInspector.panels.resources) return;
    if (!WebInspector.panels.resources._databases) return;
    existingDbs = WebInspector.panels.resources._databases;
    existingDbNames = {};
    for (_i = 0, _len = existingDbs.length; _i < _len; _i++) {
      existingDb = existingDbs[_i];
      existingDbNames[existingDb.name] = existingDb;
    }
    _results = [];
    for (_j = 0, _len2 = databaseRecords.length; _j < _len2; _j++) {
      databaseRecord = databaseRecords[_j];
      if (existingDbNames[databaseRecord.name]) continue;
      database = new WebInspector.Database(databaseRecord.id, databaseRecord.domain, databaseRecord.name, databaseRecord.version);
      _results.push(WebInspector.panels.resources.addDatabase(database));
    }
    return _results;
  };

  return WeinreExtraTargetEventsImpl;

})();

require("../common/MethodNamer").setNamesForClass(module.exports);

});
