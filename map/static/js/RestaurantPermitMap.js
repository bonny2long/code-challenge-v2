import React, { useEffect, useState, useMemo } from "react";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import RAW_COMMUNITY_AREAS from "../../../data/raw/community-areas.geojson";

function YearSelect({ setFilterVal }) {
  // Filter by the permit issue year for each restaurant
  const startYear = 2026;
  const years = [...Array(11).keys()].map((increment) => {
    return startYear - increment;
  });
  const options = years.map((year) => {
    return (
      <option value={year} key={year}>
        {year}
      </option>
    );
  });

  return (
    <>
      <label htmlFor="yearSelect" className="fs-3">
        Filter by year:{" "}
      </label>
      <select
        id="yearSelect"
        className="form-select form-select-lg mb-3"
        onChange={(e) => setFilterVal(e.target.value)}
      >
        {options}
      </select>
    </>
  );
}

export default function RestaurantPermitMap() {
  const communityAreaColors = ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"];

  const [currentYearData, setCurrentYearData] = useState([]); // Array of {name, area_id, num_permits}
  const [year, setYear] = useState(2026); // Currently selected filter year

  // Construct the API endpoint with the selected year
  const yearlyDataEndpoint = `/map-data/?year=${year}`;

  // Fetch data whenever the selected year changes
  useEffect(() => {
    fetch(yearlyDataEndpoint)
      .then((res) => res.json())
      .then((data) => {
        setCurrentYearData(data);
      });
  }, [yearlyDataEndpoint]);

  // Compute totals from the fetched data
  const totalPermits = useMemo(() => {
    return currentYearData.reduce((sum, area) => sum + area.num_permits, 0);
  }, [currentYearData]);

  const maxNumPermits = useMemo(() => {
    if (currentYearData.length === 0) return 0;
    return Math.max(...currentYearData.map((area) => area.num_permits));
  }, [currentYearData]);

  // Build a lookup map from area_id to permit data for fast access
  const dataByAreaId = useMemo(() => {
    const lookup = {};
    currentYearData.forEach((area) => {
      lookup[String(area.area_id)] = area;
    });
    return lookup;
  }, [currentYearData]);

  /**
   * Translates a percentage (num_permits / max_permits) into a choropleth color grade.
   */
  function getColor(percentageOfPermits) {
    if (percentageOfPermits > 0.75) return communityAreaColors[3];
    if (percentageOfPermits > 0.5) return communityAreaColors[2];
    if (percentageOfPermits > 0.25) return communityAreaColors[1];
    return communityAreaColors[0];
  }

  /**
   * Configures visual style and hover interaction for each GeoJSON feature (Community Area).
   */
  function setAreaInteraction(feature, layer) {
    const areaId = feature.properties.area_numbe;
    const areaData = dataByAreaId[String(areaId)];
    const numPermits = areaData ? areaData.num_permits : 0;
    const areaName = feature.properties.community || "Unknown";
    const percentage = maxNumPermits > 0 ? numPermits / maxNumPermits : 0;

    layer.setStyle({
      fillColor: getColor(percentage),
      fillOpacity: 0.7,
      weight: 1,
      color: "#666",
    });

    layer.on("mouseover", () => {
      layer.bindPopup(
        `<strong>${areaName}</strong><br/>Permits: ${numPermits}`,
      );
      layer.openPopup();
    });
  }

  return (
    <>
      <YearSelect filterVal={year} setFilterVal={setYear} />
      <p className="fs-4">
        Restaurant permits issued this year: {totalPermits}
      </p>
      <p className="fs-4">
        Maximum number of restaurant permits in a single area: {maxNumPermits}
      </p>
      <MapContainer id="restaurant-map" center={[41.88, -87.62]} zoom={10}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
        />
        {currentYearData.length > 0 ?
          <GeoJSON
            data={RAW_COMMUNITY_AREAS}
            onEachFeature={setAreaInteraction}
            key={maxNumPermits}
          />
        : null}
      </MapContainer>
    </>
  );
}
