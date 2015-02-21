(function (root) {
    root.qsc = factory();
    function factory() {
        var qsc = {
            get: get,
            getMyData: getMyData,
            getFavorites: getFavorites,
            getFavoriters: getFavoriters,
            getFollowings: getFollowings,
            getFavoritesForTrackFavoriters: getFavoritesForTrackFavoriters,
            getFavoriterFavoritesForUserFavorites: getFavoriterFavoritesForUserFavorites,
            connect: connect
        };
        return qsc;

        function getMyData() {
            var deferred = Q.defer();
            getFavorites('/me').then(function (favorites) {
                getFollowings('/me').then(function (followings) {
                    deferred.resolve({ favorites: favorites, followings: followings });
                });
            });
            return deferred.promise;
        }

        function getFavoriterFavoritesForUserFavorites(userUrl) {
            var deferred = Q.defer();
            getFavorites(userUrl).then(getFavoritesForTracksFavoriters).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        }

        function getFavoritesForTrackFavoriters(trackUrl) {
            var deferred = Q.defer();
            getFavoriters(trackUrl).then(getFavoritesForUsers).then(deferred.resolve);
            rejectAfter(5000, 500, deferred);
            return deferred.promise;
        }

        function getFavoritesForUsers(users) {
            return groupItemsForItems(users, function(u) { return getFavorites('/users/' + u.id); });
        }

        function getFollowingsForUsers(users) {
            return groupItemsForItems(users, function(u) { return getFollowings('/users/' + u.id); });
        }

        function getFollowersForUsers(users) {
            return groupItemsForItems(users, function(u) { return getFollowers('/users/' + u.id); });
        }

        function getFavoritersForTracks(tracks) {
            return groupItemsForItems(tracks, function(t) { return getFavoriters('/tracks/' + t.id); });
        }

        function getFavoritesForTracksFavoriters(tracks) {
            return groupItemsForItems(tracks, function (t) { return getFavoriters('/tracks/' + t.id); }).then(getFavoritesForUsers);
        }


        function groupItemsForItems(items, getItems) {
            var deferred = Q.defer();
            Q.all(items.filter(function(x){return (!x.count) || (x.count > 1);}).map(getItems)).then(function (its) {
                var grouped = [];
                for (var i = 0; i < its.length; i++) {
                    var itg = its[i];
                    for (var j = 0; j < itg.length; j++) {
                        var tr = itg[j];
                        var it = grouped.filter(function (i) { return i.item.id == tr.id; });
                        if (it.length == 0) {
                            grouped.push({ id: tr.id, item: tr, count: 1 });
                        }
                        else {
                            it[0].count++;
                        }
                    }
                }
                deferred.resolve(grouped);
            }, deferred.reject);
            return deferred.promise;
        }

        function getFavorites(userUrl) {
            return get(userUrl + '/favorites');
        }

        function getFavoriters(trackUrl) {
            return get(trackUrl + '/favoriters');
        }

        function getFollowers(userUrl) {
            return get(userUrl + '/followers');
        }

        function getFollowings(userUrl) {
            return get(userUrl + '/followings');
        }

        function connect() {
            var deferred = Q.defer();
            SC.connect(function () {
                deferred.resolve();
            });
            rejectAfter(5000, 500, deferred, connect);
            return deferred.promise;
        }

        function get(url) {
            var deferred = Q.defer();
            SC.get(url, function(data) {
                deferred.resolve(data);
            });
            rejectAfter(5000, 500, deferred, url);
            return deferred.promise;
        }

        function rejectAfter(timeout, step, deferred, msg) {
            var t = 0;
            (function waitOrReject() {
                if (t > timeout / step) {
                    deferred.reject('Timeout: ' + msg)
                    return;
                };
                t++;
                setTimeout(waitOrReject, step);
            })();
        }
    }
})(window);