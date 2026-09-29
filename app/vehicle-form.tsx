import { ConfirmModal } from "@/components/ConfirmModal";
import { MXButton } from "@/components/MXButton";
import { MXHeader } from "@/components/MXHeader";
import { MXInput } from "@/components/MXInput";
import { GroupRow, GroupTotal, NoteCard, SectionCard } from "@/components/MXSection";
import { MXTabBar } from "@/components/MXTabBar";
import { SuccessModal } from "@/components/SuccessModal";
import { useNotice } from "@/components/useNotice";
import { displayDateToISO, formatDateInputDDMMYYYY, isoToDisplayDate } from "@/lib/dateInput";
import { safeBack } from "@/lib/navigation";
import { taxYearForDate } from "@/lib/taxRules";
import {
  firstError,
  validateDate,
  validateNonNegativeAmount,
  validateOdometer,
  validateRegistration,
  validateVehicleText,
  validateVehicleYear,
} from "@/lib/validation";
import {
  monthsInUse,
  purchaseVatCanBeClaimed,
  saleOutcome,
  VEHICLE_WRITE_OFF_YEARS,
  wearAndTearAllowance,
  wearAndTearClaim,
  wearAndTearCostBase,
  type VehicleType,
} from "@/lib/wearAndTear";
import { claimsVehicleCostsAsBusiness, EMPLOYEE_VEHICLE_NOTE } from "@/lib/workType";
import { profileService } from "@/services/profileService";
import { vehicleService } from "@/services/vehicleService";
import { useAuthStore } from "@/stores/authStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { odometerTotalKm, useVehicleStore, vehicleLabel } from "@/stores/vehicleStore";
import { colour, radius, space, typography } from "@/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// "2026/27" → { opening: "1 March 2026", closing: "28 February 2027" }
function taxYearReadingDates(taxYear: string) {
  const start = parseInt(taxYear.slice(0, 4), 10);
  const end = start + 1;
  const leap = (end % 4 === 0 && end % 100 !== 0) || end % 400 === 0;
  return { opening: `1 March ${start}`, closing: `${leap ? 29 : 28} February ${end}` };
}

const fmtKm = (n: number) => `${n.toLocaleString("en-ZA", { maximumFractionDigits: 1 })} km`;
const fmtR = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Write-off periods per SARS Interpretation Note 47 (see lib/wearAndTear.ts).
const VEHICLE_TYPES: { key: VehicleType; label: string; desc: string }[] = [
  { key: "passenger", label: "Passenger car", desc: `Sedan, hatchback, SUV or minibus. Its cost is spread over ${VEHICLE_WRITE_OFF_YEARS.passenger} years.` },
  { key: "double_cab", label: "Double-cab bakkie", desc: `A bakkie with four doors. SARS treats it like a passenger car, so its cost is spread over ${VEHICLE_WRITE_OFF_YEARS.double_cab} years.` },
  { key: "delivery", label: "Single-cab bakkie or panel van", desc: `Built mainly to carry goods. Its cost is spread over ${VEHICLE_WRITE_OFF_YEARS.delivery} years.` },
  { key: "motorcycle", label: "Motorcycle", desc: `Its cost is spread over ${VEHICLE_WRITE_OFF_YEARS.motorcycle} years.` },
];

// A labelled on/off row inside a SectionCard (same build as the lump-sum
// directive switch on tax-liability-inputs).
function SwitchRow({
  title,
  hint,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: space.xs }}>
      <View style={{ flex: 1, marginRight: space.md }}>
        <Text style={{ ...typography.rowValue, color: colour.text }}>{title}</Text>
        <Text style={{ ...typography.hintText, color: colour.textSub, marginTop: 2 }}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colour.border, true: colour.accent }}
        thumbColor={colour.white}
      />
    </View>
  );
}

export default function VehicleFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthStore();
  const { activeTaxYear } = useExpenseStore();
  const {
    vehicles,
    readings,
    wearAndTear,
    load,
    create,
    update,
    setArchived,
    remove,
    saveOdometer,
    syncWearAndTear,
  } = useVehicleStore();
  const { notice, showNotice } = useNotice();

  const existing = id ? vehicles.find((v) => v.id === id) : undefined;
  const isEdit = !!id;

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registration, setRegistration] = useState("");
  const [openingKm, setOpeningKm] = useState("");
  const [closingKm, setClosingKm] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [acquiredDate, setAcquiredDate] = useState("");
  const [soldDate, setSoldDate] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [showSale, setShowSale] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("passenger");
  const [vatClaimed, setVatClaimed] = useState(false);
  const [vatRegistered, setVatRegistered] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<null | { title: string; message: string }>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveInstead, setShowArchiveInstead] = useState(false);

  useEffect(() => {
    if (!user) return;
    load(user.id, activeTaxYear).catch(() => {});
    // Only VAT vendors can have claimed input VAT back on the purchase.
    profileService
      .getProfile(user.id)
      .then((p) => {
        setVatRegistered(!!p?.vat_registered);
        setIsEmployee(!claimsVehicleCostsAsBusiness(p?.work_type));
      })
      .catch(() => {});
    // Fresh business-use % for the wear & tear preview.
    if (id) syncWearAndTear(user.id, activeTaxYear);
  }, [user, activeTaxYear]);

  // Prefill once the store has the vehicle — same reason as home-office-setup:
  // reacting to the loaded value avoids reading a stale closure.
  useEffect(() => {
    if (!existing) return;
    setMake(existing.make);
    setModel(existing.model);
    setYear(String(existing.year));
    setRegistration(existing.registration);
    setPurchasePrice(existing.purchasePrice != null ? String(existing.purchasePrice) : "");
    setAcquiredDate(existing.acquiredDate ? isoToDisplayDate(existing.acquiredDate) : "");
    setSoldDate(existing.soldDate ? isoToDisplayDate(existing.soldDate) : "");
    setSalePrice(existing.salePrice != null ? String(existing.salePrice) : "");
    setShowSale(!!existing.soldDate);
    setVehicleType(existing.vehicleType);
    setVatClaimed(existing.vatClaimed);
  }, [existing?.id]);

  const reading = id ? readings[id] : undefined;
  useEffect(() => {
    if (!reading) return;
    setOpeningKm(reading.openingKm != null ? String(reading.openingKm) : "");
    setClosingKm(reading.closingKm != null ? String(reading.closingKm) : "");
  }, [reading?.vehicleId, reading?.openingKm, reading?.closingKm]);

  const dates = taxYearReadingDates(activeTaxYear);
  const opening = openingKm.trim() ? Number(openingKm) : null;
  const closing = closingKm.trim() ? Number(closingKm) : null;
  const yearKm = odometerTotalKm({
    vehicleId: id ?? "",
    taxYear: activeTaxYear,
    openingKm: opening,
    closingKm: closing,
  });

  // ── Wear & tear preview (s11(e)) ─────────────────────────────────────────
  const priceNum = purchasePrice.trim() ? Number(purchasePrice) : NaN;
  const acquiredIso = acquiredDate.length === 10 ? displayDateToISO(acquiredDate) : null;
  // The flag describes the purchase, so it's kept as saved even if the user
  // has since deregistered for VAT (the switch is only shown to vendors).
  // VAT on buying a car or double cab can never be claimed (lib/wearAndTear.ts).
  const effectiveVatClaimed =
    purchaseVatCanBeClaimed(vehicleType) && (vatRegistered ? vatClaimed : !!existing?.vatClaimed);
  const costBase = priceNum > 0 ? wearAndTearCostBase(priceNum, effectiveVatClaimed) : null;
  const soldIso = soldDate.length === 10 && !validateDate(displayDateToISO(soldDate)) ? displayDateToISO(soldDate) : null;
  const previewAllowance =
    costBase != null && acquiredIso && !validateDate(acquiredIso)
      ? wearAndTearAllowance({ cost: costBase, acquiredDate: acquiredIso, type: vehicleType, soldDate: soldIso, taxYear: activeTaxYear })
      : null;
  const previewMonths = acquiredIso ? monthsInUse(acquiredIso, activeTaxYear, soldIso) : 12;
  const businessRatio = id ? wearAndTear[id]?.businessRatio ?? null : null;

  // ── Sale preview (s8(4)(a) recoupment / s11(o) loss) ─────────────────────
  const salePriceNum = salePrice.trim() ? Number(salePrice) : NaN;
  const salePreview =
    costBase != null && acquiredIso && soldIso && salePriceNum >= 0 && soldIso >= acquiredIso
      ? saleOutcome({ cost: costBase, acquiredDate: acquiredIso, type: vehicleType, soldDate: soldIso }, salePriceNum, 1)
      : null;
  // Business share needs lifetime logbook data, which the last sync worked out
  // (only when the sale falls in the tax year being viewed).
  const syncedSale = id ? wearAndTear[id]?.sale ?? null : null;
  const saleRatio = syncedSale?.lifetimeBusinessRatio ?? null;

  const validate = () => {
    const next: Record<string, string | null> = {
      make: validateVehicleText(make, "Make"),
      model: validateVehicleText(model, "Model"),
      year: validateVehicleYear(year),
      registration: validateRegistration(registration),
      openingKm: validateOdometer(openingKm, "Start-of-year km reading"),
      closingKm: validateOdometer(closingKm, "End-of-year km reading"),
      purchasePrice: purchasePrice.trim()
        ? validateNonNegativeAmount(purchasePrice, "Purchase price")
        : null,
      acquiredDate: acquiredDate.trim()
        ? validateDate(displayDateToISO(acquiredDate), { fieldName: "Date bought" })
        : null,
    };
    if (!next.openingKm && !next.closingKm && opening != null && closing != null && closing < opening) {
      next.closingKm = "The end-of-year reading can't be lower than the start-of-year reading.";
    }
    if (showSale) {
      next.soldDate = validateDate(displayDateToISO(soldDate), { fieldName: "Date sold" });
      next.salePrice = validateNonNegativeAmount(salePrice, "Selling price");
      if (!next.soldDate && acquiredDate.trim() && displayDateToISO(soldDate) < displayDateToISO(acquiredDate)) {
        next.soldDate = "The date sold can't be before the date bought.";
      }
      if (!purchasePrice.trim() || !acquiredDate.trim()) {
        next.purchasePrice = next.purchasePrice ?? "Add what you paid for the vehicle and when you bought it first.";
      }
    }
    setErrors(next);
    return firstError(...Object.values(next));
  };

  const handleSave = async () => {
    if (!user) return;
    const error = validate();
    if (error) {
      // Each problem is also shown under its own field.
      showNotice({ title: "Check the highlighted fields", message: error });
      return;
    }
    setSaving(true);
    try {
      const input = {
        make,
        model,
        year: Number(year),
        registration,
        purchasePrice: purchasePrice.trim() ? Number(purchasePrice) : null,
        acquiredDate: acquiredDate.trim() ? displayDateToISO(acquiredDate) : null,
        vehicleType,
        vatClaimed: effectiveVatClaimed,
        soldDate: showSale ? displayDateToISO(soldDate) : null,
        salePrice: showSale ? Number(salePrice) : null,
      };
      let vehicleId = id;
      if (isEdit && id) {
        await update(user.id, id, input);
      } else {
        vehicleId = (await create(user.id, input)).id;
      }
      // A sold vehicle can't be picked for new trips.
      if (vehicleId && input.soldDate && !existing?.isArchived) {
        await setArchived(user.id, vehicleId, true);
      }
      const readingChanged =
        opening !== (reading?.openingKm ?? null) || closing !== (reading?.closingKm ?? null);
      if (vehicleId && readingChanged) {
        await saveOdometer(user.id, {
          vehicleId,
          taxYear: activeTaxYear,
          openingKm: opening,
          closingKm: closing,
        });
      }
      await syncWearAndTear(user.id, activeTaxYear);
      // The recoupment belongs to the tax year of the sale, which may not be
      // the one being viewed (and a removed sale must clear its old row).
      const saleYears = new Set(
        [input.soldDate, existing?.soldDate].filter((d): d is string => !!d).map(taxYearForDate),
      );
      saleYears.delete(activeTaxYear);
      for (const ty of saleYears) await syncWearAndTear(user.id, ty);
      setDone({
        title: isEdit ? "Vehicle saved" : "Vehicle added",
        message: isEdit
          ? `${make} ${model} has been updated.`
          : `${make} ${model} has been added. You can now pick it when you log a trip.`,
      });
    } catch {
      showNotice({
        title: "Couldn't save your vehicle",
        message: "Please check your internet connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // A vehicle with trips can't be deleted — its logbook must stay intact for
  // SARS — so offer hiding it instead.
  const handleDelete = async () => {
    if (!user || !id) return;
    try {
      const trips = await vehicleService.countTripsForVehicle(user.id, id);
      if (trips === 0) setShowDeleteConfirm(true);
      else if (existing && !existing.isArchived) setShowArchiveInstead(true);
      else
        showNotice({
          title: "This vehicle can't be deleted",
          message: "It has trips in your logbook. SARS can ask to see them for up to 5 years, so they must be kept.",
          tone: "info",
        });
    } catch {
      showNotice({ title: "Something went wrong", message: "Please check your internet connection and try again." });
    }
  };

  const confirmDelete = async () => {
    if (!user || !id) return;
    setShowDeleteConfirm(false);
    try {
      await remove(user.id, id);
      await syncWearAndTear(user.id, activeTaxYear);
      safeBack(router, "/vehicles");
    } catch {
      showNotice({ title: "Couldn't delete this vehicle", message: "Please try again." });
    }
  };

  const toggleArchived = async () => {
    if (!user || !id || !existing) return;
    setShowArchiveInstead(false);
    try {
      await setArchived(user.id, id, !existing.isArchived);
      await syncWearAndTear(user.id, activeTaxYear);
      safeBack(router, "/vehicles");
    } catch {
      showNotice({ title: "Something went wrong", message: "Please check your internet connection and try again." });
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title={isEdit ? "Edit vehicle" : "Add vehicle"}
        subtitle={existing ? vehicleLabel(existing) : "For your travel logbook"}
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <NoteCard
            icon="car.fill"
            title="One logbook per vehicle"
            body="SARS wants a separate logbook for each vehicle you use for work. You'll also need these details for your tax return."
          />

          {/* ── Vehicle details ─────────────────────────────────────────── */}
          <SectionCard title="Vehicle details">
            <View style={{ flexDirection: "row", gap: space.md }}>
              <View style={{ flex: 1 }}>
                <MXInput
                  label="Make"
                  value={make}
                  onChangeText={setMake}
                  placeholder="e.g. Toyota"
                  autoCapitalize="words"
                  error={errors.make ?? undefined}
                />
              </View>
              <View style={{ flex: 1 }}>
                <MXInput
                  label="Model"
                  value={model}
                  onChangeText={setModel}
                  placeholder="e.g. Hilux 2.4 GD-6"
                  autoCapitalize="words"
                  error={errors.model ?? undefined}
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: space.md }}>
              <View style={{ flex: 1 }}>
                <MXInput
                  label="Year"
                  value={year}
                  onChangeText={(t) => setYear(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="e.g. 2019"
                  keyboardType="number-pad"
                  error={errors.year ?? undefined}
                />
              </View>
              <View style={{ flex: 1 }}>
                <MXInput
                  label="Number plate"
                  value={registration}
                  onChangeText={setRegistration}
                  placeholder="e.g. CA 123-456"
                  autoCapitalize="characters"
                  error={errors.registration ?? undefined}
                />
              </View>
            </View>
          </SectionCard>

          {/* ── Vehicle type (sets the wear & tear write-off period) ────── */}
          <SectionCard title="Type of vehicle">
            {VEHICLE_TYPES.map((opt) => {
              const selected = vehicleType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setVehicleType(opt.key)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: space.sm,
                    borderRadius: radius.md,
                    backgroundColor: selected ? colour.primary50 : "transparent",
                    gap: space.md,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selected ? colour.primary : colour.border,
                      backgroundColor: selected ? colour.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colour.onPrimary }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.itemTitle, color: colour.textPrimary }}>{opt.label}</Text>
                    <Text style={{ ...typography.itemSub, color: colour.textSecondary, marginTop: 2 }}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </SectionCard>

          {/* ── Km readings ─────────────────────────────────────────────── */}
          <SectionCard
            title={`Km readings for ${activeTaxYear}`}
            subtitle="You need both readings to claim for your vehicle. Take a photo of your dashboard on both dates, just in case."
          >
            <MXInput
              label="Start-of-year km reading"
              value={openingKm}
              onChangeText={setOpeningKm}
              placeholder="e.g. 84250"
              keyboardType="decimal-pad"
              hint={`The km on your dashboard on ${dates.opening}, or on the day you started using this vehicle for work.`}
              error={errors.openingKm ?? undefined}
            />
            <MXInput
              label="End-of-year km reading"
              value={closingKm}
              onChangeText={setClosingKm}
              placeholder="Add this at the end of the tax year"
              keyboardType="decimal-pad"
              hint={`The km on your dashboard on ${dates.closing}. Leave it blank until then.`}
              error={errors.closingKm ?? undefined}
            />
            {yearKm != null && (
              <GroupTotal label="Total km driven this tax year" value={fmtKm(yearKm)} />
            )}
          </SectionCard>

          {/* ── Purchase details (wear & tear) ──────────────────────────── */}
          <SectionCard
            title="When you bought it"
            subtitle="Used to work out wear & tear: the value your vehicle loses each year, which you can claim part of."
          >
            <MXInput
              label="Purchase price (R)"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="0"
              keyboardType="decimal-pad"
              hint="The price you paid, including VAT. Don't include interest or finance charges."
              error={errors.purchasePrice ?? undefined}
            />
            <MXInput
              label="Date bought"
              value={acquiredDate}
              onChangeText={(t) => setAcquiredDate(formatDateInputDDMMYYYY(t))}
              placeholder="DD/MM/YYYY"
              keyboardType="number-pad"
              hint="The day you bought it and started using it."
              error={errors.acquiredDate ?? undefined}
            />
            {vatRegistered && !purchaseVatCanBeClaimed(vehicleType) && (
              <Text style={{ ...typography.hintText, color: colour.textSub }}>
                You can't claim back the VAT on buying a {vehicleType === "double_cab" ? "double-cab bakkie" : "car"}, even as a VAT vendor. So we use the full price, including VAT.
              </Text>
            )}
            {vatRegistered && purchaseVatCanBeClaimed(vehicleType) && (
              <SwitchRow
                title="I claimed the VAT back on this vehicle"
                hint={
                  vehicleType === "delivery"
                    ? "Only switch this on if you got the VAT back on your VAT return. SARS checks single cabs and panel vans one by one, so make sure yours qualifies."
                    : "Only switch this on if you got the VAT back on your VAT return."
                }
                value={vatClaimed}
                onChange={setVatClaimed}
              />
            )}
          </SectionCard>

          {/* ── Wear & tear result ──────────────────────────────────────── */}
          {previewAllowance != null && costBase != null && (
            <SectionCard title={`Wear & tear for ${activeTaxYear}`}>
              <View>
                <GroupRow label={`Price${effectiveVatClaimed ? " (without VAT)" : ""}`} value={fmtR(costBase)} />
                <GroupRow
                  label={
                    costBase < 7000
                      ? "Under R7 000, so all of it counts this year"
                      : `Spread over ${VEHICLE_WRITE_OFF_YEARS[vehicleType]} years${previewMonths > 0 && previewMonths < 12 ? `, for the ${previewMonths} months you had it` : ""}`
                  }
                  value={fmtR(previewAllowance)}
                  last={isEmployee || businessRatio == null}
                />
                {!isEmployee && businessRatio != null && (
                  <GroupTotal
                    label={`You can claim (${(businessRatio * 100).toFixed(1)}% work use)`}
                    value={fmtR(wearAndTearClaim(previewAllowance, businessRatio))}
                    accent
                  />
                )}
              </View>
              <Text style={{ ...typography.hintText, color: colour.textSub }}>
                {isEmployee
                  ? EMPLOYEE_VEHICLE_NOTE
                  : previewAllowance === 0
                    ? "Nothing to claim this tax year. Either the vehicle's full cost has already been claimed, or you hadn't bought it yet."
                    : businessRatio == null
                      ? `You can claim the part of this that matches how much you drove for work. We'll work it out once you've added both km readings for ${activeTaxYear}, and add it to your Vehicle Expenses for you.`
                      : "We add this to your Vehicle Expenses for you, and it updates when your trips or km readings change."}
              </Text>
            </SectionCard>
          )}

          {/* ── Sold ────────────────────────────────────────────────────── */}
          {isEdit && (
            <SectionCard title="Selling this vehicle">
              <SwitchRow
                title="I've sold this vehicle"
                hint="We'll stop claiming wear & tear and work out if any tax is due on the sale."
                value={showSale}
                onChange={setShowSale}
              />
              {showSale && (
                <>
                  <View style={{ flexDirection: "row", gap: space.md }}>
                    <View style={{ flex: 1 }}>
                      <MXInput
                        label="Date sold"
                        value={soldDate}
                        onChangeText={(t) => setSoldDate(formatDateInputDDMMYYYY(t))}
                        placeholder="DD/MM/YYYY"
                        keyboardType="number-pad"
                        error={errors.soldDate ?? undefined}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <MXInput
                        label="Selling price (R)"
                        value={salePrice}
                        onChangeText={setSalePrice}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        error={errors.salePrice ?? undefined}
                      />
                    </View>
                  </View>
                  <Text style={{ ...typography.hintText, color: colour.textSub }}>
                    Also add an end-of-year km reading from the day you sold it.
                  </Text>

                  {salePreview && (
                    <>
                      <View>
                        <GroupRow label="Value left for tax when sold" value={fmtR(salePreview.taxValue)} />
                        <GroupTotal
                          label={
                            salePreview.grossRecoupment > 0
                              ? "Sold for more than that by"
                              : salePreview.grossLoss > 0
                                ? "Sold for less than that by"
                                : "Sold for exactly that"
                          }
                          value={fmtR(salePreview.grossRecoupment || salePreview.grossLoss)}
                        />
                      </View>
                      <Text style={{ ...typography.hintText, color: colour.textSub }}>
                        {isEmployee
                          ? "You didn't claim wear & tear as a salaried employee, so there's no tax on the sale."
                          : salePreview.grossRecoupment > 0
                            ? saleRatio != null && syncedSale
                              ? `Because you sold it for more than its value for tax, ${fmtR(syncedSale.recoupment)} is added back to your ${salePreview.saleTaxYear} income. That's the work part (${(saleRatio * 100).toFixed(1)}% of all the km you drove in it). We've done this for you.`
                              : `Because you sold it for more than its value for tax, the work part of this is added back to your ${salePreview.saleTaxYear} income. We'll work it out once that year's km readings are in. Switch to the ${salePreview.saleTaxYear} tax year to see it.`
                            : salePreview.grossLoss > 0
                              ? "You may be able to claim the work part of this loss. MyExpense can't do this for you yet, so ask your accountant or tax practitioner."
                              : "There's no tax to pay on the sale."}
                      </Text>
                    </>
                  )}
                </>
              )}
            </SectionCard>
          )}

          <MXButton
            label={saving ? "Saving…" : isEdit ? "Save vehicle" : "Add vehicle"}
            variant="primary"
            size="L"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            fullWidth
          />

          {existing && (
            <View style={{ alignItems: "center", marginTop: space.lg, gap: space.md }}>
              <TouchableOpacity onPress={toggleArchived}>
                <Text style={{ ...typography.mTbtn, color: colour.primary }}>
                  {existing.isArchived ? "Use this vehicle again" : "Hide this vehicle (no longer used)"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Text style={{ ...typography.mTbtn, color: colour.danger }}>Delete vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <MXTabBar />

      {notice}
      <SuccessModal
        visible={!!done}
        title={done?.title ?? ""}
        message={done?.message}
        primaryLabel="Done"
        onPrimary={() => {
          setDone(null);
          safeBack(router, "/vehicles");
        }}
      />
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete this vehicle?"
        message="This removes the vehicle and its km readings. You can't undo this."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmModal
        visible={showArchiveInstead}
        title="Hide it instead?"
        message="This vehicle has trips in your logbook. SARS can ask to see them for up to 5 years, so it can't be deleted. You can hide it so it doesn't show up for new trips."
        confirmLabel="Hide vehicle"
        cancelLabel="Cancel"
        destructive={false}
        icon="info.circle.fill"
        onConfirm={toggleArchived}
        onCancel={() => setShowArchiveInstead(false)}
      />
    </SafeAreaView>
  );
}
