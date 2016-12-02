"use strict";require("../../base/statistics.js");require("../metric_registry.js");require("./loading_metric.js");require("../../value/histogram.js");'use strict';global.tr.exportTo('tr.metrics.sh',function(){var FRAMES_PER_SEC=60;var FRAME_MS=tr.b.convertUnit(1.0/FRAMES_PER_SEC,tr.b.UnitScale.Metric.NONE,tr.b.UnitScale.Metric.MILLI);function getPowerData_(model,start,end){var durationInMs=end-start;var durationInS=tr.b.convertUnit(durationInMs,tr.b.UnitScale.Metric.MILLI,tr.b.UnitScale.Metric.NONE);var energyInJ=model.device.powerSeries.getEnergyConsumedInJ(start,end);var powerInW=energyInJ/durationInS;return{duration:durationInMs,energy:energyInJ,power:powerInW};}function getNavigationTTIIntervals_(model){var values=new tr.v.ValueSet();tr.metrics.sh.loadingMetric(values,model);var ttiValues=values.getValuesNamed('timeToFirstInteractive');var intervals=[];for(var bin of tr.b.getOnlyElement(ttiValues).allBins){for(var diagnostics of bin.diagnosticMaps){var breakdown=diagnostics.get('Navigation infos');intervals.push(tr.b.Range.fromExplicitRange(breakdown.value.start,breakdown.value.interactive));}}return intervals.sort((x,y)=>x.min-y.min);}function makeTimeHistogram_(values,title,description){var hist=new tr.v.Histogram(title+':time',tr.b.Unit.byName.timeDurationInMs_smallerIsBetter);hist.customizeSummaryOptions({avg:false,count:false,max:true,min:true,std:false,sum:true});hist.description='Time spent in '+description;values.addHistogram(hist);return hist;}function makeEnergyHistogram_(values,title,description){var hist=new tr.v.Histogram(title+':energy',tr.b.Unit.byName.energyInJoules_smallerIsBetter);hist.customizeSummaryOptions({avg:false,count:false,max:true,min:true,std:false,sum:true});hist.description='Energy consumed in '+description;values.addHistogram(hist);return hist;}function makePowerHistogram_(values,title,description){var hist=new tr.v.Histogram(title+':power',tr.b.Unit.byName.powerInWatts_smallerIsBetter);hist.customizeSummaryOptions({avg:true,count:false,max:true,min:true,std:false,sum:false});hist.description='Energy consumption rate in '+description;values.addHistogram(hist);return hist;}function storePowerData_(data,timeHist,energyHist,powerHist){if(timeHist!==undefined)timeHist.addSample(data.duration);if(energyHist!==undefined)energyHist.addSample(data.energy);if(powerHist!==undefined)powerHist.addSample(data.power);}function createHistograms_(model,values){var hists={};hists.railStageToTimeHist=new Map();hists.railStageToEnergyHist=new Map();hists.railStageToPowerHist=new Map();hists.scrollTimeHist=makeTimeHistogram_(values,'scroll','scrolling');hists.scrollEnergyHist=makeEnergyHistogram_(values,'scroll','scrolling');hists.scrollPowerHist=makePowerHistogram_(values,'scroll','scrolling');hists.loadTimeHist=makeTimeHistogram_(values,'load','page loads');hists.loadEnergyHist=makeEnergyHistogram_(values,'load','page loads');hists.afterLoadTimeHist=makeTimeHistogram_(values,'after_load','period after load');hists.afterLoadPowerHist=makePowerHistogram_(values,'after_load','period after load');hists.videoPowerHist=makePowerHistogram_(values,'video','video playback');hists.frameEnergyHist=makeEnergyHistogram_(values,'per_frame','each frame');for(var exp of model.userModel.expectations){var currTitle=exp.title.toLowerCase().replace(' ','_');if(!hists.railStageToTimeHist.has(currTitle)){var timeHist=makeTimeHistogram_(values,currTitle,'RAIL stage '+currTitle);var energyHist=makeEnergyHistogram_(values,currTitle,'RAIL stage '+currTitle);var powerHist=makePowerHistogram_(values,currTitle,'RAIL stage '+currTitle);hists.railStageToTimeHist.set(currTitle,timeHist);hists.railStageToEnergyHist.set(currTitle,energyHist);hists.railStageToPowerHist.set(currTitle,powerHist);}}return hists;}function processInteractionRecord_(exp,model,hists){var currTitle=exp.title.toLowerCase().replace(' ','_');var data=getPowerData_(model,exp.start,exp.end);storePowerData_(data,hists.railStageToTimeHist.get(currTitle),hists.railStageToEnergyHist.get(currTitle),hists.railStageToPowerHist.get(currTitle));if(exp.title.indexOf("Scroll")!==-1){storePowerData_(data,hists.scrollTimeHist,hists.scrollEnergyHist,hists.scrollPowerHist);}if(exp.title.indexOf("Video")!==-1)storePowerData_(data,undefined,undefined,hists.videoPowerHist);}function computeLoadingMetric_(model,hists){var intervals=getNavigationTTIIntervals_(model);var lastLoadTime=undefined;for(var interval of intervals){var loadData=getPowerData_(model,interval.min,interval.max);storePowerData_(loadData,hists.loadTimeHist,hists.loadEnergyHist,undefined);lastLoadTime=lastLoadTime==undefined?interval.max:Math.max(lastLoadTime,interval.max);}if(lastLoadTime!==undefined){var afterLoadData=getPowerData_(model,lastLoadTime,model.bounds.max);storePowerData_(afterLoadData,hists.afterLoadTimeHist,undefined,hists.afterLoadPowerHist);}}function computeFrameBasedPowerMetric_(model,hists){model.device.powerSeries.updateBounds();var currentTime=model.device.powerSeries.bounds.min;while(currentTime<model.device.powerSeries.bounds.max){var frameData=getPowerData_(model,currentTime,currentTime+FRAME_MS);hists.frameEnergyHist.addSample(frameData.energy);currentTime+=FRAME_MS;}}function powerMetric(values,model){if(!model.device.powerSeries)return;var hists=createHistograms_(model,values);for(var exp of model.userModel.expectations)processInteractionRecord_(exp,model,hists);computeLoadingMetric_(model,hists);computeFrameBasedPowerMetric_(model,hists);}tr.metrics.MetricRegistry.register(powerMetric);return{powerMetric:powerMetric};});