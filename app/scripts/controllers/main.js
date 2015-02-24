'use strict';

/**
 * @ngdoc function
 * @name scSuggestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the scSuggestApp
 */
angular.module('scSuggestApp').controller('MainCtrl', function ($scope, $timeout) {
    var ctrl = this;

    $scope.inputOptions = [
        { label: 'track', value: 3 },
        { label: 'artist', value: 4 },
        { label: 'user', value: 5 }
    ];
    $scope.inputOption = $scope.inputOptions[0];

    $scope.outputOptions = [
        { label: 'tracks', value: 1 },
       // { label: 'artists', value: 2 }
    ];
    $scope.outputOption = $scope.outputOptions[0];
    $scope.inputUrl = '';
    $scope.connect = connect;
    $scope.getTracks = suggest;
    $scope.next = next;
    $scope.previous = previous;
    $scope.pause = pause;
    $scope.next = next;
    $scope.play = play;
    $scope.connected = false;
    $scope.hasResults = false;
    $scope.currentPosition = 0;
    $scope.currentItem = {};
    $scope.playTrack = playTrack;
    $scope.inputPlaceholder = '';
    $scope.paused = false;
    $scope.loading = false;
    $scope.errorText = '';
    $scope.showInput = function () {
        return $scope.inputOption.value > 2;
    }

    init();

    $scope.$watch('hasResults', onHasResults);
    $scope.$watch('inputOption', function (nv, ov) {
        switch (nv.value) {
            case 1:
            case 2:
                $scope.inputPlaceholder = '';
                break;
            case 3:
                $scope.inputPlaceholder = 'track url';
                break;
            case 4:
            case 5:
                $scope.inputPlaceholder = 'user url';
                break;
        }
    });

    $scope.$watch('inputUrl', function (nv, ov) {
        console.log(nv + ov);
    });

    function init() {
        SC.initialize({
            client_id: '747e72b7a1a64556d542a254e330fcc0',
            redirect_uri: 'http://MalvinButterfinger.github.io/sc-suggest/callback.html'
        });
    }

    function connect() {
        qsc.connect().then(qsc.getMyData).then(function (myData) {
            $scope.connected = true;
            $scope.inputOptions = [
                { label: 'my favorites', value: 1 },
                { label: 'my followings', value: 2 },
                { label: 'track', value: 3 },
                { label: 'artist', value: 4 },
                { label: 'user', value: 5 }
            ];
            $scope.inputOption = $scope.inputOptions[0];
            $scope.filteredTracks = myData.favorites;
            $scope.filteredUsers = myData.followings;
            $scope.$apply();
        });
    }

    function suggest() {
        $scope.errorText = '';
        switch ($scope.outputOption.value) {
            case 1: // tracks
                switch ($scope.inputOption.value) {
                    case 1:
                        getTracks('/me');
                        break;
                    case 2:
                        getTracksFromUserFollowings('/me');
                        break;
                    case 3:
                        SC.get('/resolve', { url: $scope.inputUrl }, function (track, error) {
                            if (error) {
                                onError($scope.inputUrl + ' ' + error.message, false);
                            }
                            getTracksFromTrack('/tracks/' + track.id);
                        });
                        break;
                    case 4:
                        SC.get('/resolve', { url: $scope.inputUrl }, function (user) {
                            getTracksFromArtist('/users/' + user.id);
                        });
                        break;
                    case 5:
                        SC.get('/resolve', { url: $scope.inputUrl }, function (user, error) {
                            if (error) {

                            }
                            qsc.getFavorites('/users/' + user.id).then(function (f) {
                                $scope.filteredTracks = f;
                            }).then(function (d) {
                                qsc.getFollowings('/users/' + user.id).then(function (f) {
                                    $scope.filteredUsers = f
                                    getTracks('/users/' + user.id);
                                });
                            });
                        });
                        break;
                }
                break;
            case 2: // artists
                break;
        }
    }

    function getTracks(user) {
        $scope.hasResults = false;
        $scope.loading = true;
        $timeout(function () {
            qsc.getFavoriterFavoritesForUserFavorites(user).then(processTracksResult, onError);
        });
    }

    function getTracksFromUserFollowings(user) {
        $scope.hasResults = false;
        $scope.loading = true;
        $timeout(function () {
            qsc.getFavoritesForUserFollowings(user).then(processTracksResult, onError);
        });
    }

    function getTracksFromTrack(track) {
        $scope.hasResults = false;
        $scope.loading = true;
        $timeout(function () {
            qsc.getFavoritesForTrackFavoriters(track).then(processTracksResult, onError);
        });
    }

    function getTracksFromArtist(artist) {
        $scope.hasResults = false;
        $scope.loading = true;
        $timeout(function () {
            qsc.getFavoritesForUserFollowers(artist).then(processTracksResult, onError);
        });
    }

    function processTracksResult(tracks) {
        tracks.sort(function (a, b) { return b.count - a.count });
        if ($scope.filteredTracks && $scope.filteredUsers) {
            tracks = tracks.filter(function (t) {
                return $scope.filteredTracks.filter(function (tt) { return tt.id == t.id; }).length == 0 && $scope.filteredUsers.filter(function (ff) { return ff.id == t.item.user.id; }).length == 0;
            });
        }
        $scope.suggested = tracks.slice(0, 2000).map(function (t, i) {
            return {
                rank: i,
                status: '',
                info: t.item.user.username + ' - ' + t.item.title,
                purl: t.item.permalink_url,
                url: 'https://w.soundcloud.com/player/?url=' + t.item.permalink_url,
                count: t.count,
                id: t.id
            }
        });
        $scope.loading = false;
        $scope.hasResults = true;
        $scope.$apply();
    }

    function onError(error, apply) {
        $scope.errorText = error;
        $scope.loading = false;
        if (apply) $timeout(function () { $scope.$apply(); });
    }

    function onHasResults(nv, ov) {
        if (!nv) return;
        $timeout(function () {
            angular.element('#widget-iframe').attr('src', $scope.suggested[0].url);
            ctrl.widget = SC.Widget('widget-iframe');
            ctrl.widget.bind(SC.Widget.Events.FINISH, function (data) {
                if (data.relativePosition == 1) next();
            });
            $scope.currentPosition = 0
            playCurrent();
        });
    }

    function play() {
        if ($scope.hasResults) {
            if (!$scope.paused) {
                $scope.currentPosition = 0;
            }
            playCurrent();
        }
    }

    function playTrack(pos) {
        $scope.currentItem.status = '';
        $scope.currentItem.htmlClass = '';
        $scope.currentPosition = pos;
        playCurrent();
    }

    function next() {
        if ($scope.hasResults) {
            $scope.currentItem.status = '';
            $scope.currentItem.htmlClass = '';
            $scope.currentPosition++;
            if ($scope.currentPosition == $scope.suggested.length) $scope.currentPosition = 0;
            playCurrent();
            $timeout(function () { $scope.$apply(); })
        }
    }

    function stop() {
        $scope.currentPosition = 0;
        $scope.currentItem.htmlClass = '';
        $scope.currentItem = $scope.suggested[$scope.currentPosition];
        ctrl.widget.stop();
    }

    function pause() {
        $scope.paused = true;
        $scope.currentItem.status = '';
        $scope.currentItem.htmlClass = 'warning';
        ctrl.widget.pause();
    }
      
    function previous() {
        $scope.currentItem.status = '';
        if ($scope.currentPosition > 0) $sc.currentPosition--;
        else $scope.currentPosition = $scope.suggested.length - 1;
        playCurrent();
    }

    function playCurrent() {
        $scope.currentItem = $scope.suggested[$scope.currentPosition];
        $scope.currentItem.status = 'playing';
        $scope.currentItem.htmlClass = 'success';
        if (!$scope.paused) ctrl.widget.load($scope.currentItem.purl, { auto_play: true });
        else ctrl.widget.play();
        $scope.paused = false;
        $timeout(function () { $scope.$apply();})
    }
});
