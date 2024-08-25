import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import icon from "./Images/icon.png";
import endPointIconImg from "./Images/endPoint.png";
import startPointIconImg from "./Images/startPoint.png";
import L from "leaflet";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
} from "@mui/material";
import "./App.css";

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
};

const calculateBearing = (start, end) => {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;

  const x = Math.sin(dLng) * Math.cos(endLat);
  const y =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  const bearing = (Math.atan2(x, y) * 180) / Math.PI;

  return (bearing + 360) % 360;
};

export default function Osm() {
  const [startPoint] = useState({ latitude: 22.1696, longitude: 91.4996 });
  const [endPoint] = useState({ latitude: 22.2637, longitude: 91.7159 });
  const [currentPosition, setCurrentPosition] = useState(startPoint);
  const [speed, setSpeed] = useState(20);
  const intervalRef = useRef(null);
  const iconRef = useRef(null);

  const bearing = calculateBearing(startPoint, endPoint);
  const distance = haversineDistance(startPoint, endPoint);
  const duration = (distance / speed) * 3600;

  const startPointIcon = new L.Icon({
    iconUrl: startPointIconImg,
    iconSize: [25, 35],
    iconAnchor: [12.5, 17.5],
  });

  const endPointIcon = new L.Icon({
    iconUrl: endPointIconImg,
    iconSize: [25, 35],
    iconAnchor: [12.5, 17.5],
  });

  const movingIcon = new L.Icon({
    iconUrl: icon,
    iconSize: [, 35],
    iconAnchor: [-15, 10],
    className: "rotating-icon",
  });

  const handleMarker = () => {
    const frames = duration * 2;
    const latStep = (endPoint.latitude - startPoint.latitude) / frames;
    const lonStep = (endPoint.longitude - startPoint.longitude) / frames;

    let frame = 0;

    intervalRef.current = setInterval(() => {
      frame++;
      const newLat = startPoint.latitude + latStep * frame;
      const newLon = startPoint.longitude + lonStep * frame;
      setCurrentPosition({ latitude: newLat, longitude: newLon });

      if (frame >= frames) {
        clearInterval(intervalRef.current);
      }
    }, 500);

    return () => {
      clearInterval(intervalRef.current);
    };
  };

  useEffect(() => {
    if (iconRef.current) {
      const iconElement = iconRef.current._icon;

      if (iconElement) {
        const existingTransform = iconElement.style.transform;
        const rotateTransform = `rotate(${bearing}deg)`;
        iconElement.style.transform = `${existingTransform} ${rotateTransform}`;
      }
    }
  }, [currentPosition]);

  function MapView() {
    const map = useMap();
    map.setView(
      [currentPosition.latitude, currentPosition.longitude],
      map.getZoom()
    );
    return null;
  }

  const handleSpeedChange = (event) => {
    setSpeed(event.target.value);
  };

  const handleSubmit = () => {
    clearInterval(intervalRef.current);
    setCurrentPosition(startPoint);
    handleMarker();
  };

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Typography className="heading">Open Street Map</Typography>
        <Box>
          <Typography variant="body1">
            {`Start Point: ${startPoint.latitude.toFixed(
              4
            )}, ${startPoint.longitude.toFixed(4)}`}
          </Typography>
          <Typography variant="body1">
            {`End Point: ${endPoint.latitude.toFixed(
              4
            )}, ${endPoint.longitude.toFixed(4)}`}
          </Typography>
          <Typography variant="body1">FPS: 2</Typography>
          <div>
            <TextField
              label="Speed (km/h)"
              variant="outlined"
              value={speed}
              onChange={handleSpeedChange}
              type="number"
              sx={{ marginTop: 2, marginBottom: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              className="button"
            >
              Start
            </Button>
          </div>
        </Box>
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          Distance: {distance.toFixed(2)} km
        </Typography>
        <Typography variant="body2">
          Estimated Time: {duration.toFixed(2)} seconds
        </Typography>
      </CardContent>
      <MapContainer
        className="map"
        center={[startPoint.latitude, startPoint.longitude]}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: "500px" }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Marker
          icon={startPointIcon}
          position={[startPoint.latitude, startPoint.longitude]}
        />
        <Marker
          icon={endPointIcon}
          position={[endPoint.latitude, endPoint.longitude]}
        />
        <Marker
          ref={iconRef}
          icon={movingIcon}
          position={[currentPosition.latitude, currentPosition.longitude]}
        />
        <MapView />
      </MapContainer>
    </Card>
  );
}
