(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TransportHours = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
Array.prototype.flat||Object.defineProperty(Array.prototype,"flat",{configurable:!0,value:function r(){var t=isNaN(arguments[0])?1:Number(arguments[0]);return t?Array.prototype.reduce.call(this,function(a,e){return Array.isArray(e)?a.push.apply(a,r.call(e,t-1)):a.push(e),a},[]):Array.prototype.slice.call(this)},writable:!0}),Array.prototype.flatMap||Object.defineProperty(Array.prototype,"flatMap",{configurable:!0,value:function(r){return Array.prototype.map.apply(this,arguments).flat()},writable:!0})

},{}],2:[function(require,module,exports){
'use strict';

var isArray = Array.isArray;
var keyList = Object.keys;
var hasProp = Object.prototype.hasOwnProperty;

module.exports = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    var arrA = isArray(a)
      , arrB = isArray(b)
      , i
      , length
      , key;

    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (arrA != arrB) return false;

    var dateA = a instanceof Date
      , dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();

    var regexpA = a instanceof RegExp
      , regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();

    var keys = keyList(a);
    length = keys.length;

    if (length !== keyList(b).length)
      return false;

    for (i = length; i-- !== 0;)
      if (!hasProp.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  return a!==a && b!==b;
};

},{}],3:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

require("array-flat-polyfill");

var DAYS = ["mo", "tu", "we", "th", "fr", "sa", "su", "ph"];
var DAYS_OH = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", "PH"];
var HOURS_RGX = /^\d{2}\:\d{2}\-\d{2}\:\d{2}$/;

var OpeningHoursBuilder = function () {
  function OpeningHoursBuilder(periods, options) {
    _classCallCheck(this, OpeningHoursBuilder);

    if (!periods || !Array.isArray(periods) || periods.filter(function (p) {
      return !OpeningHoursBuilder.IsPeriodValid(p);
    }).length > 0) {
      throw new Error("The given periods are not valid");
    }

    options = Object.assign({
      explicitPH: false
    }, options);
    var ohHours = periods.map(function (p) {
      return {
        days: p.days,
        hours: OpeningHoursBuilder.HoursToOH(p.hours)
      };
    });
    var ohHoursDays = {};
    ohHours.forEach(function (p) {
      if (ohHoursDays[p.hours]) {
        ohHoursDays[p.hours] = ohHoursDays[p.hours].concat(p.days);
      } else {
        ohHoursDays[p.hours] = p.days;
      }
    });
    var ohPeriods = Object.entries(ohHoursDays).map(function (e) {
      return [OpeningHoursBuilder.DaysToOH(e[1]), e[0]];
    });
    this._ohValue = ohPeriods.map(function (p) {
      return p.join(" ").trim();
    }).join("; ");

    if (!options.explicitPH && (this._ohValue === "00:00-24:00" || this._ohValue === "Mo-Su,PH 00:00-24:00")) {
      this._ohValue = "24/7";
    }

    var distinctDays = _toConsumableArray(new Set(periods.map(function (p) {
      return p.days;
    }).flat()));

    if (options.explicitPH && distinctDays.length === 7 && !distinctDays.includes("ph")) {
      this._ohValue += "; PH off";
    }
  }

  _createClass(OpeningHoursBuilder, [{
    key: "getValue",
    value: function getValue() {
      return this._ohValue;
    }
  }], [{
    key: "IsPeriodValid",
    value: function IsPeriodValid(p) {
      return p && p.days && p.days.length > 0 && p.days.filter(function (d) {
        return !d || typeof d !== "string" || !DAYS.includes(d);
      }).length === 0 && p.hours && p.hours.length > 0 && p.hours.filter(function (h) {
        return !h || typeof h !== "string" || !HOURS_RGX.test(h);
      }).length === 0;
    }
  }, {
    key: "DaysToOH",
    value: function DaysToOH(days) {
      var daysId = _toConsumableArray(new Set(days.map(function (d) {
        return DAYS.indexOf(d);
      }))).sort();

      for (var id = 1; id < daysId.length; id++) {
        var currDay = daysId[id];
        var prevDay = daysId[id - 1];

        if (Array.isArray(prevDay)) {
          prevDay = prevDay[1];
        }

        if (currDay === prevDay + 1 && currDay !== DAYS.indexOf("ph")) {
          if (Array.isArray(daysId[id - 1])) {
            daysId[id - 1][1] = currDay;
          } else {
            daysId[id - 1] = [prevDay, currDay];
          }

          daysId.splice(id, 1);
          id--;
        }
      }

      var dayPart = daysId.map(function (dId) {
        return Array.isArray(dId) ? dId.map(function (d) {
          return DAYS_OH[d];
        }).join(dId[1] - dId[0] > 1 ? "-" : ",") : DAYS_OH[dId];
      }).join(",");
      return dayPart;
    }
  }, {
    key: "HoursToOH",
    value: function HoursToOH(hours) {
      var minutesRanges = hours.map(function (h) {
        return h.split("-").map(function (hp) {
          return OpeningHoursBuilder.TimeToMinutes(hp);
        });
      }).sort(function (a, b) {
        return a[0] - b[0];
      });

      for (var id = 1; id < minutesRanges.length; id++) {
        var currRange = minutesRanges[id];
        var prevRange = minutesRanges[id - 1];

        if (prevRange[1] >= currRange[0]) {
          if (prevRange[1] < currRange[1] || currRange[0] > currRange[1]) {
            prevRange[1] = currRange[1];
          }

          minutesRanges.splice(id, 1);
          id--;
        }
      }

      var hourPart = minutesRanges.map(function (mr) {
        return mr.map(function (mrp) {
          return OpeningHoursBuilder.MinutesToTime(mrp);
        }).join("-");
      }).join(",");
      return hourPart;
    }
  }, {
    key: "TimeToMinutes",
    value: function TimeToMinutes(time) {
      var parts = time.split(":").map(function (p) {
        return parseInt(p);
      });
      return parts[0] * 60 + parts[1];
    }
  }, {
    key: "MinutesToTime",
    value: function MinutesToTime(minutes) {
      var twoDigits = function twoDigits(v) {
        return v < 10 ? "0" + v.toString() : v.toString();
      };

      return twoDigits(Math.floor(minutes / 60).toFixed(0)) + ":" + twoDigits(minutes % 60);
    }
  }]);

  return OpeningHoursBuilder;
}();

module.exports = OpeningHoursBuilder;

},{"array-flat-polyfill":1}],4:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var OpeningHoursParser = function () {
  function OpeningHoursParser(value) {
    _classCallCheck(this, OpeningHoursParser);

    this.openingHours = {};

    this._parse(value);

    if (Object.values(this.openingHours).filter(function (oh) {
      return oh.length === 0;
    }).length === Object.keys(this.openingHours).length) {
      throw new Error("Can't parse opening_hours : " + value);
    }
  }

  _createClass(OpeningHoursParser, [{
    key: "getTable",
    value: function getTable() {
      return this.openingHours;
    }
  }, {
    key: "_parse",
    value: function _parse(inp) {
      var _this = this;

      this._initOpeningHoursObj();

      inp = this._simplify(inp);

      var parts = this._splitHard(inp);

      parts.forEach(function (part) {
        _this._parseHardPart(part);
      });
    }
  }, {
    key: "_simplify",
    value: function _simplify(input) {
      if (input == "24/7") {
        input = "mo-su 00:00-24:00; ph 00:00-24:00";
      }

      input = input.toLocaleLowerCase();
      input = input.trim();
      input = input.replace(/ +(?= )/g, '');
      input = input.replace(' -', '-');
      input = input.replace('- ', '-');
      input = input.replace(' :', ':');
      input = input.replace(': ', ':');
      input = input.replace(' ,', ',');
      input = input.replace(', ', ',');
      input = input.replace(' ;', ';');
      input = input.replace('; ', ';');
      return input;
    }
  }, {
    key: "_splitHard",
    value: function _splitHard(inp) {
      return inp.split(';');
    }
  }, {
    key: "_parseHardPart",
    value: function _parseHardPart(part) {
      var _this2 = this;

      if (part == "24/7") {
        part = "mo-su 00:00-24:00";
      }

      var segments = part.split(/\ |\,/);
      var tempData = {};
      var days = [];
      var times = [];
      segments.forEach(function (segment, i) {
        if (_this2._checkDay(segment)) {
          if (times.length === 0) {
            days = days.concat(_this2._parseDays(segment));
          } else {
            days.forEach(function (day) {
              if (tempData[day]) {
                tempData[day] = tempData[day].concat(times);
              } else {
                tempData[day] = times;
              }
            });
            days = _this2._parseDays(segment);
            times = [];
          }
        }

        if (_this2._checkTime(segment)) {
          if (i === 0 && days.length === 0) {
            days = _this2._parseDays("Mo-Su,PH");
          }

          if (segment == "off") {
            times = "off";
          } else {
            times.push(_this2._cleanTime(segment));
          }
        }
      });
      days.forEach(function (day) {
        if (tempData[day]) {
          tempData[day] = tempData[day].concat(times);
        } else {
          tempData[day] = times;
        }
      });
      days.forEach(function (day) {
        if (times === "off") {
          tempData[day] = [];
        } else if (times.length === 0) {
          tempData[day] = ["00:00-24:00"];
        }
      });

      for (var key in tempData) {
        this.openingHours[key] = tempData[key];
      }
    }
  }, {
    key: "_parseDays",
    value: function _parseDays(part) {
      var _this3 = this;

      part = part.toLowerCase();
      var days = [];
      var softparts = part.split(',');
      softparts.forEach(function (part) {
        var rangecount = (part.match(/\-/g) || []).length;

        if (rangecount == 0) {
          days.push(part);
        } else {
          days = days.concat(_this3._calcDayRange(part));
        }
      });
      return days;
    }
  }, {
    key: "_cleanTime",
    value: function _cleanTime(time) {
      if (time.match(/^[0-9]:[0-9]{2}/)) {
        time = "0" + time;
      }

      if (time.match(/^[0-9]{2}:[0-9]{2}\-[0-9]:[0-9]{2}/)) {
        time = time.substring(0, 6) + "0" + time.substring(6);
      }

      return time;
    }
  }, {
    key: "_initOpeningHoursObj",
    value: function _initOpeningHoursObj() {
      this.openingHours = {
        su: [],
        mo: [],
        tu: [],
        we: [],
        th: [],
        fr: [],
        sa: [],
        ph: []
      };
    }
  }, {
    key: "_calcDayRange",
    value: function _calcDayRange(range) {
      var def = {
        su: 0,
        mo: 1,
        tu: 2,
        we: 3,
        th: 4,
        fr: 5,
        sa: 6
      };
      var rangeElements = range.split('-');
      var dayStart = def[rangeElements[0]];
      var dayEnd = def[rangeElements[1]];

      var numberRange = this._calcRange(dayStart, dayEnd, 6);

      var outRange = [];
      numberRange.forEach(function (n) {
        for (var key in def) {
          if (def[key] == n) {
            outRange.push(key);
          }
        }
      });
      return outRange;
    }
  }, {
    key: "_calcRange",
    value: function _calcRange(min, max, maxval) {
      if (min == max) {
        return [min];
      }

      var range = [min];
      var rangepoint = min;

      while (rangepoint < (min < max ? max : maxval)) {
        rangepoint++;
        range.push(rangepoint);
      }

      if (min > max) {
        range = range.concat(this._calcRange(0, max, maxval));
      }

      return range;
    }
  }, {
    key: "_checkTime",
    value: function _checkTime(inp) {
      if (inp.match(/[0-9]{1,2}:[0-9]{2}\+/)) {
        return true;
      }

      if (inp.match(/[0-9]{1,2}:[0-9]{2}\-[0-9]{1,2}:[0-9]{2}/)) {
        return true;
      }

      if (inp.match(/off/)) {
        return true;
      }

      return false;
    }
  }, {
    key: "_checkDay",
    value: function _checkDay(inp) {
      var days = ["mo", "tu", "we", "th", "fr", "sa", "su", "ph"];

      if (inp.match(/\-/g)) {
        var rangelements = inp.split('-');

        if (days.indexOf(rangelements[0]) !== -1 && days.indexOf(rangelements[1]) !== -1) {
          return true;
        }
      } else {
        if (days.indexOf(inp) !== -1) {
          return true;
        }
      }

      return false;
    }
  }]);

  return OpeningHoursParser;
}();

module.exports = OpeningHoursParser;

},{}],5:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

require("array-flat-polyfill");

var OpeningHoursParser = require("./OpeningHoursParser");

var OpeningHoursBuilder = require("./OpeningHoursBuilder");

var deepEqual = require("fast-deep-equal");

var TAG_UNSET = "unset";
var TAG_INVALID = "invalid";
var DAYS_ID = ["mo", "tu", "we", "th", "fr", "sa", "su", "ph"];

var TransportHours = function () {
  function TransportHours() {
    _classCallCheck(this, TransportHours);
  }

  _createClass(TransportHours, [{
    key: "tagsToHoursObject",
    value: function tagsToHoursObject(tags) {
      var opens;

      try {
        opens = tags.opening_hours ? new OpeningHoursParser(tags.opening_hours).getTable() : TAG_UNSET;
      } catch (e) {
        opens = TAG_INVALID;
      }

      var interval;

      try {
        interval = tags.interval ? this.intervalStringToMinutes(tags.interval) : TAG_UNSET;
      } catch (e) {
        interval = TAG_INVALID;
      }

      var intervalCond, intervalCondByDay;

      try {
        intervalCond = tags["interval:conditional"] ? this.intervalConditionalStringToObject(tags["interval:conditional"]) : TAG_UNSET;
        intervalCondByDay = intervalCond !== TAG_UNSET ? this._intervalConditionObjectToIntervalByDays(intervalCond) : TAG_UNSET;
      } catch (e) {
        intervalCond = TAG_INVALID;
        intervalCondByDay = TAG_INVALID;
      }

      var computedIntervals;

      try {
        computedIntervals = this._computeAllIntervals(opens, interval, intervalCondByDay);
      } catch (e) {
        computedIntervals = TAG_INVALID;
      }

      return {
        opens: opens,
        defaultInterval: interval,
        otherIntervals: intervalCond,
        otherIntervalsByDays: intervalCondByDay,
        allComputedIntervals: computedIntervals
      };
    }
  }, {
    key: "intervalsObjectToTags",
    value: function intervalsObjectToTags(allIntervals) {
      var _this = this;

      var result = {};
      var periodsOH = allIntervals.map(function (p) {
        return {
          days: p.days,
          hours: Object.keys(p.intervals)
        };
      });
      result.opening_hours = new OpeningHoursBuilder(periodsOH, {
        explicitPH: true
      }).getValue();
      var intervalDuration = {};
      allIntervals.forEach(function (p) {
        var nbDays = p.days.length;
        Object.entries(p.intervals).forEach(function (e) {
          var _e2 = _slicedToArray(e, 2),
              timerange = _e2[0],
              interval = _e2[1];

          var duration = _this._timerangeDuration(timerange);

          if (intervalDuration[interval]) {
            intervalDuration[interval] += duration * nbDays;
          } else {
            intervalDuration[interval] = duration * nbDays;
          }
        });
      });
      var nbIntervals = Object.keys(intervalDuration).length;

      if (nbIntervals === 0) {
        throw new Error("No interval is defined in given periods");
      } else if (nbIntervals === 1) {
          result.interval = Object.keys(intervalDuration)[0].toString();
        } else {
            var defaultInterval, maxDuration;
            Object.entries(intervalDuration).forEach(function (e) {
              if (!defaultInterval || e[1] > maxDuration) {
                defaultInterval = e[0];
                maxDuration = e[1];
              }
            });
            result.interval = defaultInterval.toString();
            var intervalPeriods = [];
            Object.entries(intervalDuration).sort(function (a, b) {
              return b[1] - a[1];
            }).filter(function (e) {
              return e[0] !== defaultInterval;
            }).forEach(function (e) {
              var interval = parseInt(e[0]);
              var applies = allIntervals.map(function (p) {
                var filtered = {
                  days: p.days
                };
                filtered.hours = Object.entries(p.intervals).filter(function (pe) {
                  return pe[1] === interval;
                }).map(function (pe) {
                  return pe[0];
                });
                return filtered;
              }).filter(function (p) {
                return p.hours.length > 0;
              });

              if (applies.length > 0) {
                intervalPeriods.push({
                  interval: interval,
                  applies: applies
                });
              }
            });
            result["interval:conditional"] = intervalPeriods.map(function (ip) {
              return ip.interval + " @ (" + new OpeningHoursBuilder(ip.applies).getValue() + ")";
            }).join("; ");
          }

      return result;
    }
  }, {
    key: "_timerangeDuration",
    value: function _timerangeDuration(timerange) {
      var _timerange$split$map = timerange.split("-").map(function (t) {
        return OpeningHoursBuilder.TimeToMinutes(t);
      }),
          _timerange$split$map2 = _slicedToArray(_timerange$split$map, 2),
          startMin = _timerange$split$map2[0],
          endMin = _timerange$split$map2[1];

      return startMin <= endMin ? endMin - startMin : 24 * 60 - startMin + endMin;
    }
  }, {
    key: "_computeAllIntervals",
    value: function _computeAllIntervals(openingHours, interval, intervalCondByDay) {
      var _this2 = this;

      if (openingHours === TAG_INVALID || interval === TAG_INVALID || interval === TAG_UNSET || intervalCondByDay === TAG_INVALID) {
        return (openingHours === TAG_INVALID || interval === TAG_INVALID) && intervalCondByDay === TAG_UNSET ? TAG_INVALID : intervalCondByDay;
      } else {
        var myIntervalCondByDay = intervalCondByDay === TAG_UNSET ? [] : intervalCondByDay;
        var myOH = openingHours;

        if (openingHours === TAG_UNSET) {
          myOH = new OpeningHoursParser("24/7").getTable();
        }

        var result = [];
        myIntervalCondByDay.forEach(function (di) {
          di.days.forEach(function (d) {
            result.push({
              days: [d],
              intervals: di.intervals
            });
          });
        });
        result = result.map(function (di) {
          var ohDay = myOH[di.days[0]];
          di.intervals = _this2._mergeIntervalsSingleDay(ohDay, interval, di.intervals);
          return di;
        });

        var daysInCondInt = _toConsumableArray(new Set(myIntervalCondByDay.map(function (d) {
          return d.days;
        }).flat()));

        var missingDays = Object.keys(myOH).filter(function (d) {
          return !daysInCondInt.includes(d);
        });
        var missingDaysOH = {};
        missingDays.forEach(function (day) {
          missingDaysOH[day] = myOH[day];
        });
        result = result.concat(this._intervalConditionObjectToIntervalByDays([{
          interval: interval,
          applies: missingDaysOH
        }]));

        for (var i = 1; i < result.length; i++) {
          for (var j = 0; j < i; j++) {
            if (deepEqual(result[i].intervals, result[j].intervals)) {
              result[j].days = result[j].days.concat(result[i].days);
              result.splice(i, 1);
              i--;
              break;
            }
          }
        }

        result.forEach(function (r) {
          return r.days.sort(function (a, b) {
            return DAYS_ID.indexOf(a) - DAYS_ID.indexOf(b);
          });
        });
        result.sort(function (a, b) {
          return DAYS_ID.indexOf(a.days[0]) - DAYS_ID.indexOf(b.days[0]);
        });
        return result;
      }
    }
  }, {
    key: "_hourRangeWithin",
    value: function _hourRangeWithin(wider, smaller) {
      if (deepEqual(wider, smaller)) {
        return true;
      } else {
        if (wider[0] <= wider[1]) {
          if (smaller[0] > smaller[1]) {
            return false;
          } else {
            return wider[0] <= smaller[0] && smaller[0] < wider[1] && wider[0] < smaller[1] && smaller[1] <= wider[1];
          }
        } else {
            if (smaller[0] <= smaller[1]) {
              if (wider[0] <= smaller[0] && wider[0] <= smaller[1]) {
                return true;
              } else {
                return false;
              }
            } else {
                return wider[0] <= smaller[0] && smaller[0] <= "24:00" && "00:00" <= smaller[1] && smaller[1] <= wider[1];
              }
          }
      }
    }
  }, {
    key: "_mergeIntervalsSingleDay",
    value: function _mergeIntervalsSingleDay(hours, interval, condIntervals) {
      var _this3 = this;

      var hourRangeToArr = function hourRangeToArr(hr) {
        return hr.map(function (h) {
          return h.split("-");
        });
      };

      var ohHours = hourRangeToArr(hours);
      var condHours = hourRangeToArr(Object.keys(condIntervals));
      var invalidCondHours = condHours.filter(function (ch) {
        var foundOhHours = false;

        for (var i = 0; i < ohHours.length; i++) {
          var ohh = ohHours[i];

          if (_this3._hourRangeWithin(ohh, ch)) {
            foundOhHours = true;
            break;
          }
        }

        return !foundOhHours;
      });

      if (invalidCondHours.length > 0) {
        throw new Error("Conditional intervals are not contained in opening hours");
      }

      var goneOverMidnight = false;
      condHours.sort(function (a, b) {
        return _this3.intervalStringToMinutes(a[0]) - _this3.intervalStringToMinutes(b[0]);
      });
      var overlappingCondHours = condHours.filter(function (ch, i) {
        if (!goneOverMidnight) {
          if (ch[0] > ch[1]) {
            goneOverMidnight = true;
          }

          return i > 0 ? condHours[i - 1][1] > ch[0] : false;
        } else {
          return true;
        }
      });

      if (overlappingCondHours.length > 0) {
        throw new Error("Conditional intervals are not exclusive (they overlaps)");
      }

      var ohHoursWithoutConds = [];
      ohHours.forEach(function (ohh, i) {
        var holes = [];
        var thisCondHours = condHours.filter(function (ch) {
          return _this3._hourRangeWithin(ohh, ch);
        });
        thisCondHours.forEach(function (ch, i) {
          var isFirst = i === 0;
          var isLast = i === thisCondHours.length - 1;

          if (isFirst && ohh[0] < ch[0]) {
            holes.push(ohh[0]);
            holes.push(ch[0]);
          }

          if (!isFirst && thisCondHours[i - 1][1] < ch[0]) {
            holes.push(thisCondHours[i - 1][1]);
            holes.push(ch[0]);
          }

          if (isLast && ch[1] < ohh[1]) {
            holes.push(ch[1]);
            holes.push(ohh[1]);
          }
        });
        ohHoursWithoutConds = ohHoursWithoutConds.concat(holes.map(function (h, i) {
          return i % 2 === 0 ? null : holes[i - 1] + "-" + h;
        }).filter(function (h) {
          return h !== null;
        }));
      });
      var result = {};
      ohHoursWithoutConds.forEach(function (h) {
        result[h] = interval;
      });
      result = Object.assign(result, condIntervals);
      return result;
    }
  }, {
    key: "intervalConditionalStringToObject",
    value: function intervalConditionalStringToObject(intervalConditional) {
      var _this4 = this;

      return this._splitMultipleIntervalConditionalString(intervalConditional).map(function (p) {
        return _this4._readSingleIntervalConditionalString(p);
      });
    }
  }, {
    key: "_intervalConditionObjectToIntervalByDays",
    value: function _intervalConditionObjectToIntervalByDays(intervalConditionalObject) {
      var result = [];
      var itvByDay = {};
      intervalConditionalObject.forEach(function (itv) {
        Object.entries(itv.applies).forEach(function (e) {
          var _e3 = _slicedToArray(e, 2),
              day = _e3[0],
              hours = _e3[1];

          if (!itvByDay[day]) {
            itvByDay[day] = {};
          }

          hours.forEach(function (h) {
            itvByDay[day][h] = itv.interval;
          });
        });
      });
      Object.entries(itvByDay).forEach(function (e) {
        var _e4 = _slicedToArray(e, 2),
            day = _e4[0],
            intervals = _e4[1];

        if (Object.keys(intervals).length > 0) {
          var ident = result.filter(function (r) {
            return deepEqual(r.intervals, intervals);
          });

          if (ident.length === 1) {
            ident[0].days.push(day);
          } else {
            result.push({
              days: [day],
              intervals: intervals
            });
          }
        }
      });
      result.forEach(function (itv) {
        return itv.days.sort(function (a, b) {
          return DAYS_ID.indexOf(a) - DAYS_ID.indexOf(b);
        });
      });
      result.sort(function (a, b) {
        return DAYS_ID.indexOf(a.days[0]) - DAYS_ID.indexOf(b.days[0]);
      });
      return result;
    }
  }, {
    key: "_splitMultipleIntervalConditionalString",
    value: function _splitMultipleIntervalConditionalString(intervalConditional) {
      if (intervalConditional.match(/\(.*\)/)) {
        var semicolons = intervalConditional.split("").map(function (c, i) {
          return c === ";" ? i : null;
        }).filter(function (i) {
          return i !== null;
        });
        var cursor = 0;
        var stack = [];

        while (semicolons.length > 0) {
          var scid = semicolons[0];
          var part = intervalConditional.substring(cursor, scid);

          if (part.match(/^[^\(\)]$/) || part.match(/\(.*\)/)) {
            stack.push(part);
            cursor = scid + 1;
          }

          semicolons.shift();
        }

        stack.push(intervalConditional.substring(cursor));
        return stack.map(function (p) {
          return p.trim();
        }).filter(function (p) {
          return p.length > 0;
        });
      } else {
        return intervalConditional.split(";").map(function (p) {
          return p.trim();
        }).filter(function (p) {
          return p.length > 0;
        });
      }
    }
  }, {
    key: "_readSingleIntervalConditionalString",
    value: function _readSingleIntervalConditionalString(intervalConditional) {
      var result = {};
      var parts = intervalConditional.split("@").map(function (p) {
        return p.trim();
      });

      if (parts.length !== 2) {
        throw new Error("Conditional interval can't be parsed : " + intervalConditional);
      }

      result.interval = this.intervalStringToMinutes(parts[0]);

      if (parts[1].match(/^\(.*\)$/)) {
        parts[1] = parts[1].substring(1, parts[1].length - 1);
      }

      result.applies = new OpeningHoursParser(parts[1]).getTable();
      return result;
    }
  }, {
    key: "intervalStringToMinutes",
    value: function intervalStringToMinutes(interval) {
      interval = interval.trim();

      if (/^\d{1,2}:\d{2}:\d{2}$/.test(interval)) {
        var parts = interval.split(":").map(function (t) {
          return parseInt(t);
        });
        return parts[0] * 60 + parts[1] + parts[2] / 60;
      } else if (/^\d{1,2}:\d{2}$/.test(interval)) {
          var _parts = interval.split(":").map(function (t) {
            return parseInt(t);
          });

          return _parts[0] * 60 + _parts[1];
        } else if (/^\d+$/.test(interval)) {
            return parseInt(interval);
          } else {
              throw new Error("Interval value can't be parsed : " + interval);
            }
    }
  }, {
    key: "minutesToIntervalString",
    value: function minutesToIntervalString(minutes) {
      if (typeof minutes !== "number") {
        throw new Error("Parameter minutes is not a number");
      }

      var h = Math.floor(minutes / 60);
      var m = Math.floor(minutes % 60);
      var s = Math.round((minutes - h * 60 - m) * 60);
      return [h, m, s].map(function (t) {
        return t.toString().padStart(2, "0");
      }).join(":");
    }
  }]);

  return TransportHours;
}();

module.exports = TransportHours;

},{"./OpeningHoursBuilder":3,"./OpeningHoursParser":4,"array-flat-polyfill":1,"fast-deep-equal":2}]},{},[5])(5)
});
