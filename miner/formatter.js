var moment = require('moment');
require("moment-duration-format");

class Formatter {
    ws(type, data) {
        var array = [type, data];
        return JSON.stringify(array);
    }

    claymore(data) {
        var result = data.result;
        var totals = result[2].split(';');
        var detailHash = result[3].split(';');
        var tempSpeed = result[6].split(';');
        var standard = {
            id: this.rigUniqueId,
            hashSpeedUnit: this.config.unit,
            version: result[0],
            miningPool: result[7],
            uptime: moment.duration(parseInt(result[1]), 'minutes').format('d [days,] hh:mm:ss'),
            total: {
                hashRate: totals[0],
                shares: totals[1],
                rejected: totals[2]
            },
            units: [],
            totalHashSecondary: result[4].split(';'),
            detailHashSecondary: result[5].split(';'),
            invalidShares: result[8].split(';')
        };

        for(var i=0; i<detailHash.length; i++) {
            var hash = detailHash[i];
            var temp = tempSpeed[2*i];
            var fanSpeed = tempSpeed[2*i+1];
            var unit = {
                hashRate: hash,
                temperature: temp ? `${temp}ºC` : "NaN",
                extraInfo: fanSpeed ? `Fan speed ${fanSpeed}%` : ""
            };
            standard.units.push(unit);
        }

        return standard;
    }

    ewbf(data) {
        let getTotal = function(units, prop) {
            var total = 0;
            if (units && Array.isArray(units)) {
                units.forEach(function(unit) {
                    total += unit[prop];
                });
            }
            return total;
        };
        var startDate = new Date(data.start_time*1000);
        var diff = Math.abs(new Date() - startDate);
        var seconds = Math.floor((diff/1000));
        var units = data.result;

        var standard = {
            id: this.rigUniqueId,
            hashSpeedUnit: this.config.unit,
            version: "EWFB Zec miner",
            miningPool: data.current_server,
            uptime: moment.duration(parseInt(seconds), 'seconds').format('d [days,] hh:mm:ss'),
            total: {
                hashRate: getTotal(units, "speed_sps"),
                shares: getTotal(units, "accepted_shares"),
                rejected: getTotal(units, "rejected_shares")
            },
            units: []
        };

        units.forEach(function(unit) {
            var convertedUnit = {
                hashRate: unit.speed_sps,
                temperature: `${unit.temperature}ºC`,
                extraInfo: `Power ${unit.gpu_power_usage}W`
            };
            standard.units.push(convertedUnit);
        });

        return standard;
    }
}

module.exports = new Formatter();