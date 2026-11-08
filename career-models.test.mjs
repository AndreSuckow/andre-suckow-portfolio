import test from 'node:test';
import assert from 'node:assert/strict';
import {clearCareerRoute,careerAvatarChoice} from './public/career-models.js';
import {CAREER_LAYOUT,isCareerMapPoint} from './public/career-map.js';

test('the personal avatar is the default while Steve and Master Chief remain explicit comparison options',()=>{
 assert.equal(careerAvatarChoice(''),'andre');assert.equal(careerAvatarChoice('?avatar=andre'),'andre');
 assert.equal(careerAvatarChoice('?avatar=steve'),'steve');assert.equal(careerAvatarChoice('?avatar=chief'),'chief');
 assert.equal(careerAvatarChoice('?avatar=../../other'),'andre');
});

test('career layout reserves 40 percent for text, 60 percent for the map and limits map gestures to that viewport',()=>{
 const {text,map}=CAREER_LAYOUT,total=text.w+map.w;
 assert(Math.abs(text.w/total-.4)<.001);assert(Math.abs(map.w/total-.6)<.001);
 assert(text.x+text.w<map.x);assert.equal(map.x+map.w,976);
 assert(isCareerMapPoint(map.x,map.y));assert(isCareerMapPoint(map.x+map.w-1,map.y+map.h-1));
 assert(!isCareerMapPoint(text.x+text.w-1,map.y));assert(!isCareerMapPoint(map.x,map.y+map.h));
});

test('route clearing removes vegetation while preserving the ground and forest outside the route',()=>{
 const vertices=[[-1,0,0],[-.9,0,0],[-1,0,.1],[-1,.5,0],[-.9,.5,0],[-1,.6,.1],[1,.5,0],[1.1,.5,0],[1,.6,.1]];
 const geometry={attributes:{position:{count:vertices.length,getX:i=>vertices[i][0],getY:i=>vertices[i][1],getZ:i=>vertices[i][2]}},setIndex(index){this.kept=index;}};
 clearCareerRoute(geometry,{roadX:-1,stations:[[-.2,1]],buildings:[[0,1.5]]});
 assert.deepEqual(geometry.kept,[0,1,2,6,7,8]);
});
