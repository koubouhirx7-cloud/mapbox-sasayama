
const gpxChunks = [
    `   <trkpt lat="35.0747" lon="135.16195000000002"><ele>218.64</ele></trkpt>
   <trkpt lat="35.07428" lon="135.162555"><ele>213.42</ele></trkpt>
   <trkpt lat="35.07386" lon="135.16316"><ele>210.28</ele></trkpt>
   <trkpt lat="35.073585" lon="135.16386"><ele>206.87</ele></trkpt>
   <trkpt lat="35.07331" lon="135.16456"><ele>202.72</ele></trkpt>
   <trkpt lat="35.07311" lon="135.16544"><ele>198.55</ele></trkpt>
   <trkpt lat="35.07314" lon="135.16632"><ele>201.13</ele></trkpt>
   <trkpt lat="35.07353" lon="135.16622"><ele>203.08</ele></trkpt>
   <trkpt lat="35.07374" lon="135.16622"><ele>202.91</ele></trkpt>
   <trkpt lat="35.07374" lon="135.1671"><ele>199.02</ele></trkpt>
   <trkpt lat="35.07385" lon="135.16773"><ele>196.6</ele></trkpt>
   ... (omitted for brevity, I will build the points array in the actual execution)
    `
];

// Calculation logic:
// For each p_i and p_{i+1}:
// dist = haversine(p_i, p_{i+1})
// dEle = ele_{i+1} - ele_i
// slope = dEle / dist
// color = slope > 0.02 ? 'uphill' : (slope < -0.02 ? 'downhill' : 'flat')
