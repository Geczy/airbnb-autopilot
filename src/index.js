import queryString from 'query-string';

const markers = ['planet fitness', 'snap fitness', 'walmart'];

class AirbnbAssistant {
  geoLocationForRoom = {};
  opened = [];

  queryParams = {
    flexible_date_search_filter_type: '1',
    adults: '1',
    refinement_paths: ['/homes'],
    source: 'structured_search_input_header',
    search_type: 'filter_change',
    tab_id: 'home_tab',
    price_max: '1500',
    min_bedrooms: '1',
    amenities: ['4', '8', '33', '34', '5', '30', '58'],
    room_types: ['Entire home/apt'],
    date_picker_type: 'calendar'
  };

  constructor() {
    let justStarted = true;
    let current = window.location.href;
    setInterval(() => {
      if (justStarted || current !== window.location.href) {
        current = window.location.href;
        justStarted = false;
        if (window.location.href.includes('/rooms/')) {
          this.initNearbyPlaces();
        } else if (window.location.href.includes('.com/s/')) {
          this.initNomad();
        }
      }
    }, 500);
  }

  initNomadSettings = () => {
    const oldParams = queryString.parse(location.search);

    const newSearch = { ...oldParams, ...this.queryParams };
    window.location.search = queryString.stringify(newSearch);
  };

  initNomad = () => {
    // Before onload on purpose
    const search = window.location.search;
    if (!multiIncludes(search, Object.keys(this.queryParams))) {
      this.initNomadSettings();
    }

    this.hideCamperAndRV();
  };

  hideCamperAndRV = () => {
    setInterval(() => {
      const multiIncludes = (text, values) => values.some((val) => text.includes(val));

      const hideIt = (element) => {
        if (element && multiIncludes(element.innerHTML, ['Camper/RV', 'Tiny house'])) {
          element.remove();
        }
      };

      document.querySelectorAll('a[aria-label]').forEach((e) => {
        const element = e.closest('._1hqul550');
        hideIt(element);
      });
      document.querySelectorAll('[itemprop="itemListElement"]').forEach(hideIt);
    }, 500);
  };

  initNearbyPlaces = () => {
    const findGeo = setInterval(() => {
      if (geoLocationForRoom.latitude) {
        clearInterval(findGeo);
        this.openNearbyPlaces();
      }
    }, 200);
  };

  openNearbyPlaces = () => {
    // Places to open when you view a listing
    const { latitude, longitude } = geoLocationForRoom;
    const roomId = window.location.pathname.substring(
      window.location.pathname.lastIndexOf('/') + 1
    );
    if (!this.opened.includes(roomId)) {
      this.opened.push(roomId);
      markers.forEach((name) => {
        const url = `https://www.google.com/maps/search/${name}/@${latitude},${longitude},10z/data=!3m1!4b1!4m7!2m6!3m5!1s${name}!2s${latitude},${longitude}!4m2!1d${longitude}!2d${latitude}`;
        window.open(url);
      });
    }
  };
}

let geoLocationForRoom = {};
const constantMock = window.fetch;
window.fetch = function () {
  return new Promise((resolve, reject) => {
    constantMock
      .apply(this, arguments)
      .then((response) => {
        if (
          !geoLocationForRoom.latitude &&
          response.url.includes('api/v3/PdpPlatformSections') > -1 &&
          response.type != 'cors'
        ) {
          response
            .clone()
            .json()
            .then((r) => {
              const hasLat = r?.data?.merlin?.pdpSections?.sections;
              if (hasLat) {
                const k = hasLat.find((a) => a.id.includes('LOCATION_DETAIL_MODAL'));
                if (k?.section?.lng && k?.section?.lat && !geoLocationForRoom.latitude) {
                  geoLocationForRoom = {
                    latitude: k?.section?.lat,
                    longitude: k?.section?.lng
                  };
                }
              }
            })
            .catch((e) => {
              reject(e);
            });
        }
        resolve(response);
      })
      .catch(() => {
        reject(response);
      });
  });
};

new AirbnbAssistant();
