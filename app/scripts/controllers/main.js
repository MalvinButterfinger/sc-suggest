'use strict';

/**
 * @ngdoc function
 * @name scSuggestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the scSuggestApp
 */
angular.module('scSuggestApp')
  .controller('MainCtrl', function ($scope, $timeout) {
      var ctrl = this;

      $scope.connect = connect;
      $scope.getTracks = getTracks;
      $scope.next = next;
      $scope.connected = false;
      $scope.hasResults = false;
      $scope.show = 'tracks';
      $scope.currentPosition = 0;
      $scope.currentItem = {};
      $scope.playTrack = playTrack;
      $scope.showTracks = function () { return $scope.show == 'tracks'; }
      init();

      $scope.$watch('hasResults', onHasResults);
      $scope.safeApply = function (fn) {
          var phase = this.$root.$$phase;
          if (phase == '$apply' || phase == '$digest') {
              if (fn && (typeof (fn) === 'function')) {
                  fn();
              }
          } else {
              this.$apply(fn);
          }
      };

      function init() {
          SC.initialize({
              client_id: '747e72b7a1a64556d542a254e330fcc0',
              redirect_uri: 'http://MalvinButterfinger.github.io/sc-suggest/callback.html'
              //redirect_uri: 'http://localhost:9000/callback.html'
          });
      }

      function connect() {
          qsc.connect().then(qsc.getMyData).then(function (myData) {
              $scope.connected = true;
              $scope.myTracks = myData.favorites;
              $scope.myFollowings = myData.followings;
          });
      }

      function getTracks() {
          $scope.hasResults = false;
          $timeout(function () {
              qsc.getFavoriterFavoritesForUserFavorites('/me').then(function (tracks) {
                  tracks.sort(function (a, b) { return b.count - a.count });
                  $scope.hasResults = true;
                  $scope.suggested = tracks.filter(function (t) {
                      return $scope.myTracks.filter(function (tt) { return tt.id == t.id; }).length == 0 && $scope.myFollowings.filter(function (ff) { return ff.id == t.item.user.id; }).length == 0;
                  }).map(function (t, i) {
                      return {
                          rank: i,
                          status: '',
                          info: t.item.user.username + ' - ' + t.item.title,
                          purl: t.item.permalink_url,
                          url: 'https://w.soundcloud.com/player/?url=' + t.item.permalink_url,
                          count: t.count,
                          id: t.id
                      }
                  });;
                  $scope.$apply();
              });
          });
      }

      function onHasResults(nv, ov) {
          if (!nv) return;
          $timeout(function () {
              angular.element('#widget-iframe').attr('src', $scope.suggested[0].url);
              ctrl.widget = ctrl.widget || SC.Widget('widget-iframe');
              ctrl.widget.bind(SC.Widget.Events.FINISH, function (data) {
                  if (data.relativePosition == 1) next();
              });
              playCurrent();
          });
      }

      function play() {
          if ($scope.hasResults) {
              $scope.currentPosition = 0;
              playCurrent();
          }
      }

      function playTrack(pos) {
          $scope.currentItem.status = '';
          $scope.currentPosition = pos;
          playCurrent();
      }

      function next() {
          if ($scope.hasResults) {
              $scope.currentItem.status = '';
              $scope.currentPosition++;
              if ($scope.currentPosition == $scope.suggested.length) $scope.currentPosition = 0;
              playCurrent();
          }
      }

      function playCurrent() {
          $scope.currentItem = $scope.suggested[$scope.currentPosition];
          $scope.currentItem.status = 'playing';
          ctrl.widget.load($scope.currentItem.purl, {auto_play: true});
      }
  });
