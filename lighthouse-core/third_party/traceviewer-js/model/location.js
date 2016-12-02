"use strict";require("../base/base.js");'use strict';global.tr.exportTo('tr.model',function(){function YComponent(stableId,yPercentOffset){this.stableId=stableId;this.yPercentOffset=yPercentOffset;}YComponent.prototype={toDict:function(){return{stableId:this.stableId,yPercentOffset:this.yPercentOffset};}};function Location(xWorld,yComponents){this.xWorld_=xWorld;this.yComponents_=yComponents;};Location.fromViewCoordinates=function(viewport,viewX,viewY){var dt=viewport.currentDisplayTransform;var xWorld=dt.xViewToWorld(viewX);var yComponents=[];var elem=document.elementFromPoint(viewX+viewport.modelTrackContainer.canvas.offsetLeft,viewY+viewport.modelTrackContainer.canvas.offsetTop);while(elem instanceof tr.ui.tracks.Track){if(elem.eventContainer){var boundRect=elem.getBoundingClientRect();var yPercentOffset=(viewY-boundRect.top)/boundRect.height;yComponents.push(new YComponent(elem.eventContainer.stableId,yPercentOffset));}elem=elem.parentElement;}if(yComponents.length==0)return;return new Location(xWorld,yComponents);};Location.fromStableIdAndTimestamp=function(viewport,stableId,ts){var xWorld=ts;var yComponents=[];var containerToTrack=viewport.containerToTrackMap;var elem=containerToTrack.getTrackByStableId(stableId);if(!elem)return;var firstY=elem.getBoundingClientRect().top;while(elem instanceof tr.ui.tracks.Track){if(elem.eventContainer){var boundRect=elem.getBoundingClientRect();var yPercentOffset=(firstY-boundRect.top)/boundRect.height;yComponents.push(new YComponent(elem.eventContainer.stableId,yPercentOffset));}elem=elem.parentElement;}if(yComponents.length==0)return;return new Location(xWorld,yComponents);};Location.prototype={get xWorld(){return this.xWorld_;},getContainingTrack:function(viewport){var containerToTrack=viewport.containerToTrackMap;for(var i in this.yComponents_){var yComponent=this.yComponents_[i];var track=containerToTrack.getTrackByStableId(yComponent.stableId);if(track!==undefined)return track;}},toViewCoordinates:function(viewport){var dt=viewport.currentDisplayTransform;var containerToTrack=viewport.containerToTrackMap;var viewX=dt.xWorldToView(this.xWorld_);var viewY=-1;for(var index in this.yComponents_){var yComponent=this.yComponents_[index];var track=containerToTrack.getTrackByStableId(yComponent.stableId);if(track!==undefined){var boundRect=track.getBoundingClientRect();viewY=yComponent.yPercentOffset*boundRect.height+boundRect.top;break;}}return{viewX:viewX,viewY:viewY};},toDict:function(){return{xWorld:this.xWorld_,yComponents:this.yComponents_};}};return{Location:Location};});