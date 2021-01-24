import queryString from 'query-string';
import { startCase } from 'lodash';

const markers = ['planet fitness', 'snap fitness', 'walmart'];

const multiIncludesAll = (text, values) =>
  !values.map((val) => text.includes(val)).filter((e) => !e).length;

const multiIncludes = (text, values) => values.some((val) => text.includes(val));

class AirbnbAssistant {
  geoLocationForRoom = {};

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

      this.initLogoMod();
    }, 500);
  }

  initLogoMod = () => {
    if (!document.getElementById('airbnb-autopilot-logo')) {
      const span = document.createElement('span');
      span.id = 'airbnb-autopilot-logo';
      span.style.marginLeft = '10px';
      span.style.fontSize = '11px';
      span.innerText = ' (for nomads)';
      document.querySelector('[aria-label="Airbnb homepage"]').append(span);
    }
  };

  initNomadSettings = () => {
    const oldParams = queryString.parse(location.search);

    const newSearch = { ...oldParams, ...this.queryParams };
    window.location.search = '?' + queryString.stringify(newSearch);
  };

  initNomad = () => {
    // Before onload on purpose
    const search = window.location.search;
    if (!multiIncludesAll(search, Object.keys(this.queryParams))) {
      this.initNomadSettings();
    }

    this.hideCamperAndRV();
    this.keepScrollingThumbnails();
  };

  keepScrollingThumbnails = () => {
    return;
    setInterval(() => {
      document.querySelectorAll('div._swjxb6a > button').forEach((element) => {
        if (element) element.click();
      });
    }, 1500);
  };

  addhiddenCounter = () => {
    this.hiddenCount += 1;
  };

  reducehiddenCounter = () => {
    this.hiddenCount -= 1;
  };

  hideCamperAndRV = () => {
    setInterval(() => {
      const hideIt = (element) => {
        if (element && multiIncludes(element.innerHTML, ['Camper/RV', 'Tiny house'])) {
          element.remove();
          this.addhiddenCounter();
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
        this.showNearbyPlaces();
      }
    }, 200);
  };

  showNearbyPlaces = () => {
    if (this.hooked) return false;
    const nearby = setInterval(() => {
      // Wait for airbnb section to load
      if (!document.querySelector('[data-section-id="OVERVIEW_DEFAULT"]')) return;

      // Don't add if already done
      const nearbyPlacesElement = document.querySelector('[list="airbnb-autopilot-nearby-places"]');
      if (nearbyPlacesElement) {
        this.hooked = true;
        const { latitude, longitude } = geoLocationForRoom;

        nearbyPlacesElement.addEventListener(
          'focusout',
          function () {
            if (!this.value) return;
            const name = this.value;
            const url = `https://www.google.com/maps/search/${name}/@${latitude},${longitude},10z/data=!3m1!4b1!4m7!2m6!3m5!1s${name}!2s${latitude},${longitude}!4m2!1d${longitude}!2d${latitude}`;
            window.open(url);
          },
          false
        );
        clearInterval(nearby);
        return;
      }

      const dataBox = `Select location to find nearby:
      <input type="text" list="airbnb-autopilot-nearby-places" />
<datalist id="airbnb-autopilot-nearby-places">
${markers.map((name) => `<option value="${startCase(name)}"></option>`)}
</datalist>
`;

      document
        .querySelector('[data-section-id="OVERVIEW_DEFAULT"]')
        .insertAdjacentHTML('beforeend', dataBox);
    }, 500);
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
      .catch((e) => {
        reject(e);
      });
  });
};

new AirbnbAssistant();
