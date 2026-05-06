import { colour } from "@/tokens";
import React from "react";
import { Dimensions, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

const SW = Dimensions.get("window").width;

const deepWorkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800.932" height="685.684" viewBox="0 0 800.932 685.684" role="img"><g transform="translate(-673.43 -291.537)"><path d="M255.615,690.678c0,1.077.589,1.953,1.32,1.956h798.284c.733,0,1.328-.876,1.328-1.956s-.595-1.956-1.328-1.956H256.943c-.731,0-1.326.867-1.328,1.945Z" transform="translate(417.815 264.968)" fill="#e6e6e6"/><g transform="translate(709.893 291.537)"><path d="M862.8,562.914l11.409,47.062a2.942,2.942,0,0,1-.057,1.588L822.4,773.293a2.94,2.94,0,0,1-5.72-.564l-7.159-63a2.943,2.943,0,0,1,.126-1.243l47.5-145.787a2.94,2.94,0,0,1,5.652.219Z" transform="translate(-156.371 -121.02)" fill="#2f2e41"/><path d="M770.185,412.038l10.536,40.378L735.074,599.885l-10.533-45.644Z" transform="translate(-67.954 33.826)" fill="#E8B16A"/><path d="M755.294,685.036c1.756,5.267,182.581-1.755,184.336-3.511a38.1,38.1,0,0,0,3.862-7.022c1.65-3.511,3.16-7.022,3.16-7.022l-7.022-56.846L760.561,604.28s-4.477,48.173-5.39,70.223a52.674,52.674,0,0,0,.123,10.534Z" transform="translate(-283.042 -19.719)" fill="#2f2e41"/><path d="M770.445,458.005l3.509,49.156h-79V458.005Z" transform="translate(-136.679 140.595)" opacity="0.1"/><path d="M718.935,462.825l.472-.093-2.226,21.159h-43.89V462.825Z" transform="translate(-186.994 151.575)" opacity="0.1"/><path d="M755.294,635.947c1.756,5.267,182.581-1.755,184.336-3.511a38.1,38.1,0,0,0,3.862-7.022H755.171a52.674,52.674,0,0,0,.123,10.534Z" transform="translate(-283.042 29.37)" opacity="0.1"/><path d="M701.736,612.7h49.156l121.135-47.4s86.024-35.112,79,31.6-19.311,156.247-19.311,156.247-38.623-17.556-59.69-12.289S865,633.763,865,633.763s-172.047,82.512-187.847,71.979-19.311-84.268-19.311-84.268Z" transform="translate(-508.622 -131.716)" fill="#090814"/><path d="M725.184,526.777l59.489,85.472L923.364,728.117s108.959,37.389,91.4,58.456-105.448-28.611-105.448-28.611S749.562,642.094,744.3,633.316s-63.2-91.29-63.2-91.29Z" transform="translate(-454.624 -199.736)" fill="#ed9da0"/><path d="M725.184,526.777l59.489,85.472L923.364,728.117s114.293,42.639,96.738,63.706-110.782-33.861-110.782-33.861S749.562,642.094,744.3,633.316s-63.2-91.29-63.2-91.29Z" transform="translate(-454.624 -199.736)" opacity="0.058"/><path d="M774.141,543.536s-26.334,45.645-31.6,70.223-79-49.156-79-49.156l-9.656-25.456s69.345-32.478,64.079-58.812S774.141,543.536,774.141,543.536Z" transform="translate(-517.826 -318.87)" fill="#ed9da0"/><circle cx="79.001" cy="79.001" r="79.001" transform="translate(182.579 75.442)" fill="#ed9da0"/><path d="M753.21,537.178l71.979,94.8L997.235,760.137s94.4,23.767,66.311,43.078-78.6-14.989-78.6-14.989-173.8-93.046-210.67-131.669S668.942,552.979,668.942,552.979Z" transform="translate(-482.85 -175.577)" fill="#ed9da0"/><path d="M774.467,589.243,795.534,622.6l125.73-39.555a98.857,98.857,0,0,1,82.307,9.93c21.945,13.825,35.99,35.77,4.389,68.248-63.2,64.956-105.335,29.845-105.335,29.845S690.2,791.135,655.087,741.979s-36.867-73.734-36.867-73.734S753.4,583.977,774.467,589.243Z" transform="translate(-600.664 -80.173)" fill="#2f2e41"/><path d="M873.356,627.477s56.178,36.867-10.534,54.423-115.868-7.022-115.868-7.022-57.934,0-57.934-29.845,19.311-33.356,19.311-33.356l59.69,8.778S840,601.143,873.356,627.477Z" transform="translate(-436.215 -2.538)" fill="#d6d6e3"/><g transform="translate(0 211.245)"><path d="M724.234,506.005l38.623,75.49s-8.778,36.867-22.822,40.378S666.3,576.229,666.3,576.229Z" transform="translate(-488.986 -459.229)" fill="#E8B16A"/><path d="M742.722,492.632a20.836,20.836,0,0,1,10.845.028c11.269,3.025,36.533,11.034,41.949,23.222,7.022,15.8,31.6,40.378,31.6,40.378s33.356,33.356,26.334,56.179S820.095,661.6,820.095,661.6s7.022,108.846-28.089,136.935-49.157,8.778-49.157,35.112S634,942.488,612.936,891.576c0,0,10.534-94.8,7.022-128.157C616.5,730.544,621.564,525.432,742.722,492.632Z" transform="translate(-612.936 -491.927)" fill="#E8B16A"/><path d="M726.231,508.7s107.091,79,87.779,112.357c0,0-64.956,31.6-79,29.845s-68.468-63.2-82.512-68.468S631.43,482.367,726.231,508.7Z" transform="translate(-540.14 -463.68)" fill="#E8B16A"/></g><path d="M31.08,37.594c4.012-3.2,8.7-6.144,13.829-5.979s10.329,4.8,9.267,9.817A81.5,81.5,0,0,1,152.26,4.654c12.747,4.5,25.247,13.494,28.175,26.69.752,3.387.913,7.1,3.028,9.852,2.667,3.468,7.769,4.253,11.97,3.033l.126-.037a3.747,3.747,0,0,1,4.528,5.29l-3.607,6.727a28.9,28.9,0,0,0,13.77-.293,3.744,3.744,0,0,1,3.976,5.827C202.334,78.07,182.465,88.614,162.189,88.49c-14.411-.088-28.97-5.055-42.994-1.741a37.346,37.346,0,0,0-25.119,52.427c-4.309-4.713-12.637-3.6-17.045,1.023s-5.548,11.517-5.1,17.887c.679,9.743,4.5,18.923,8.52,27.858-33.738-1.062-65.65-24.729-76.391-56.74C-6.73,97.061,4.574,58.738,31.08,37.594Z" transform="translate(192.224 0) rotate(21)" fill="#090814"/></g></g></svg>`;

// ── Wireframe receipt panel ───────────────────────────────────────────────────
function ReceiptPanel() {
  const LINE = { height: 7, borderRadius: 3.5, backgroundColor: "#DDDDE8", marginBottom: 7 };
  return (
    <View style={{
      position: "absolute", right: 10, top: 22,
      width: 108, height: 148,
      backgroundColor: "#EAEAF2", borderRadius: 16, overflow: "hidden",
    }}>
      <View style={{ height: 26, backgroundColor: "#DDDDE8", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10 }}>
        {[0, 1, 2].map((i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#CECEDA" }} />)}
      </View>
      <View style={{ padding: 10 }}>
        <View style={{ ...LINE, width: 80 }} />
        <View style={{ ...LINE, width: 68 }} />
        <View style={{ height: 24, borderRadius: 7, backgroundColor: "#E8E7FA", marginBottom: 7, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 6 }}>
          <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "#A8A7F0" }} />
          <View style={{ width: 26, height: 8, borderRadius: 4, backgroundColor: "#6B6AD8" }} />
        </View>
        <View style={{ ...LINE, width: 58 }} />
        <View style={{ ...LINE, width: 74 }} />
        <View style={{ ...LINE, width: 46 }} />
      </View>
    </View>
  );
}

// ── Wireframe phone panel ────────────────────────────────────────────────────
function PhonePanel() {
  const LINE = { height: 6, borderRadius: 3, backgroundColor: "#DDDDE8" };
  return (
    <View style={{
      position: "absolute", left: 10, top: 90,
      width: 78, height: 140,
      backgroundColor: "#EAEAF2", borderRadius: 16, overflow: "hidden",
    }}>
      <View style={{ height: 22, backgroundColor: "#DDDDE8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#6B6AD8" }} />
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#CECEDA" }} />
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#CECEDA" }} />
      </View>
      {[44, 32, 38].map((w, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingTop: 8 }}>
          <View style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: i === 1 ? "#E8E7FA" : "#DDDDE8" }} />
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ ...LINE, width: w }} />
            <View style={{ ...LINE, width: w - 10, backgroundColor: "#E8E7FA" }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function OnboardingHeroScene() {
  const sceneW = SW;
  const sceneH = 296;

  return (
    <View style={{ width: sceneW, height: sceneH, position: "relative" }}>
      {/* Background glow */}
      <View style={{
        position: "absolute",
        width: 280, height: 280, borderRadius: 140,
        backgroundColor: "#E8E7FA", opacity: 0.45,
        top: 8, alignSelf: "center",
      }} />

      {/* Wireframe panels */}
      <ReceiptPanel />
      <PhonePanel />

      {/* Floor shadow */}
      <View style={{
        position: "absolute",
        bottom: 6, alignSelf: "center",
        width: 260, height: 18,
        backgroundColor: "rgba(107,106,216,0.08)",
        borderRadius: 100,
      }} />

      {/* Main SVG illustration */}
      <View style={{
        position: "absolute",
        alignSelf: "center",
        top: 10,
        width: 260, height: 260,
      }}>
        <SvgXml xml={deepWorkSvg} width={260} height={260} />
      </View>

      {/* R badge */}
      <View style={{
        position: "absolute", top: 32, left: 28,
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: colour.warning,
        alignItems: "center", justifyContent: "center",
        shadowColor: colour.warning, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
      }}>
        <Text style={{ fontSize: 19, fontWeight: "900", color: colour.white }}>R</Text>
      </View>

      {/* Check badge */}
      <View style={{
        position: "absolute", top: 122, right: 14,
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: colour.success,
        alignItems: "center", justifyContent: "center",
        shadowColor: colour.success, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
      }}>
        <Text style={{ fontSize: 22, color: colour.white, fontWeight: "800", lineHeight: 26 }}>✓</Text>
      </View>

      {/* Sparkle dots */}
      <View style={{ position: "absolute", width: 11, height: 11, borderRadius: 5.5, backgroundColor: "#D8D7F5", top: 148, right: 12 }} />
      <View style={{ position: "absolute", width: 7, height: 7, borderRadius: 3.5, backgroundColor: colour.warning, opacity: 0.55, top: 174, right: 8 }} />
      <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#D8D7F5", top: 182, left: 50 }} />
    </View>
  );
}
