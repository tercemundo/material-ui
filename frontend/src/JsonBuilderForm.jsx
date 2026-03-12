import React, { useState, useMemo } from "react";
import {
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Slider,
  Autocomplete,
  Rating,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Divider,
  Chip,
  Alert,
  Paper,
  Button,
  OutlinedInput,
  ListItemText,
  FormGroup,
} from "@mui/material";
import DataObjectIcon from "@mui/icons-material/DataObject";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CodeIcon from "@mui/icons-material/Code";

// ── Default JSON example ─────────────────────────────────────────────────────
const DEFAULT_JSON = JSON.stringify(
  [
    {
      components: [
        {
          type: "simple-text-field",
          name: "motivo",
          label: "Motivo",
          breakpoints: { md: 6, xs: 12 },
          inputType: "string",
          disabled: false,
        },
        {
          type: "select",
          name: "ambiente",
          label: "Ambiente",
          breakpoints: { md: 6, xs: 12 },
          options: [
            { label: "Alto", value: "alto" },
            { label: "Bajo", value: "bajo" },
          ],
          disabled: false,
        },
        {
          type: "switch",
          name: "aplica_todos_cluster",
          label: "Aplica a todo el cluster",
          breakpoints: { xs: 12 },
          disabled: false,
        },
        {
          type: "checkbox",
          name: "acepta_terminos",
          label: "Acepta términos y condiciones",
          breakpoints: { xs: 12 },
          disabled: false,
        },
        {
          type: "radio",
          name: "prioridad",
          label: "Prioridad",
          breakpoints: { md: 6, xs: 12 },
          options: [
            { label: "Alta", value: "alta" },
            { label: "Media", value: "media" },
            { label: "Baja", value: "baja" },
          ],
          disabled: false,
        },
        {
          type: "slider",
          name: "volumen",
          label: "Volumen",
          breakpoints: { md: 6, xs: 12 },
          min: 0,
          max: 100,
          step: 10,
          disabled: false,
        },
        {
          type: "rating",
          name: "puntuacion",
          label: "Puntuación",
          breakpoints: { md: 6, xs: 12 },
          max: 5,
          disabled: false,
        },
        {
          type: "multi-select",
          name: "tags",
          label: "Tags",
          breakpoints: { md: 6, xs: 12 },
          options: [
            { label: "Frontend", value: "frontend" },
            { label: "Backend", value: "backend" },
            { label: "DevOps", value: "devops" },
            { label: "QA", value: "qa" },
          ],
          disabled: false,
        },
        {
          type: "autocomplete",
          name: "ciudad",
          label: "Ciudad",
          breakpoints: { md: 6, xs: 12 },
          options: [
            { label: "Buenos Aires", value: "bsas" },
            { label: "Córdoba", value: "cba" },
            { label: "Rosario", value: "ros" },
          ],
          disabled: false,
        },
        {
          type: "textarea",
          name: "descripcion",
          label: "Descripción",
          breakpoints: { xs: 12 },
          rows: 3,
          disabled: false,
        },
        {
          type: "number",
          name: "cantidad",
          label: "Cantidad",
          breakpoints: { md: 4, xs: 12 },
          min: 0,
          max: 999,
          disabled: false,
        },
        {
          type: "password",
          name: "clave",
          label: "Clave secreta",
          breakpoints: { md: 4, xs: 12 },
          disabled: false,
        },
        {
          type: "date",
          name: "fecha_inicio",
          label: "Fecha de inicio",
          breakpoints: { md: 4, xs: 12 },
          disabled: false,
        },
        {
          type: "time",
          name: "hora_inicio",
          label: "Hora de inicio",
          breakpoints: { md: 6, xs: 12 },
          disabled: false,
        },
        {
          type: "color",
          name: "color_primario",
          label: "Color primario",
          breakpoints: { md: 6, xs: 12 },
          disabled: false,
        },
        {
          type: "toggle-button",
          name: "modo_vista",
          label: "Modo de vista",
          breakpoints: { xs: 12 },
          options: [
            { label: "Lista", value: "list" },
            { label: "Grilla", value: "grid" },
            { label: "Mapa", value: "map" },
          ],
          disabled: false,
        },
        {
          type: "file",
          name: "adjunto",
          label: "Adjuntar archivo",
          breakpoints: { xs: 12 },
          accept: ".pdf,.png,.jpg",
          disabled: false,
        },
        {
          type: "multi-text-field",
          name: "etiquetas",
          label: "Etiquetas",
          breakpoints: { xs: 12 },
          placeholder: "Escribí y presioná Enter o coma",
          disabled: false,
        },
      ],
    },
  ],
  null,
  2
);

// ── SUPPORTED TYPES LIST ─────────────────────────────────────────────────────
const SUPPORTED_TYPES = [
  "simple-text-field",
  "textarea",
  "number",
  "password",
  "select",
  "multi-select",
  "multi-text-field",
  "autocomplete",
  "checkbox",
  "radio",
  "switch",
  "slider",
  "rating",
  "toggle-button",
  "date",
  "time",
  "color",
  "file",
];

// ── Shared text-field styles ──────────────────────────────────────────────────
const tfSx = {
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#10b981",
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#10b981" },
};

// ── MultiTextField: chip-based tag input ─────────────────────────────────────
function MultiTextField({ label, name, disabled, placeholder, values, onChange }) {
  const [inputVal, setInputVal] = useState("");
  const chips = values[name] ?? [];

  const addChip = () => {
    const trimmed = inputVal.trim().replace(/,+$/, "");
    if (trimmed && !chips.includes(trimmed)) {
      onChange(name, [...chips, trimmed]);
    }
    setInputVal("");
  };

  const removeChip = (chip) =>
    onChange(name, chips.filter((c) => c !== chip));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip();
    } else if (e.key === "Backspace" && inputVal === "" && chips.length) {
      removeChip(chips[chips.length - 1]);
    }
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        alignItems: "center",
        cursor: "text",
        minHeight: 48,
        "&:focus-within": { borderColor: "#10b981", borderWidth: 2 },
      }}
      onClick={() => document.getElementById(`mtf-${name}`)?.focus()}
    >
      {chips.map((chip) => (
        <Chip
          key={chip}
          label={chip}
          size="small"
          onDelete={disabled ? undefined : () => removeChip(chip)}
          sx={{
            bgcolor: "#10b98120",
            color: "#10b981",
            "& .MuiChip-deleteIcon": { color: "#10b98180", "&:hover": { color: "#10b981" } },
          }}
        />
      ))}
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 120 }}>
        {chips.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ px: 0.5, lineHeight: 1 }}>
            {label}
          </Typography>
        )}
        <Box
          id={`mtf-${name}`}
          component="input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addChip}
          disabled={disabled}
          placeholder={chips.length === 0 ? placeholder ?? "Enter o coma para agregar" : ""}
          sx={{
            border: "none",
            outline: "none",
            bgcolor: "transparent",
            color: "text.primary",
            fontSize: "0.875rem",
            fontFamily: "inherit",
            p: 0.5,
            flex: 1,
            minWidth: 80,
          }}
        />
      </Box>
    </Box>
  );
}

// ── Individual component renderer ─────────────────────────────────────────────
function RenderComponent({ comp, values, onChange }) {
  const {
    type,
    name,
    label,
    breakpoints,
    options = [],
    disabled = false,
    min,
    max,
    step,
    rows,
    accept,
  } = comp;

  const mdSize = breakpoints?.md ?? 12;
  const xsSize = breakpoints?.xs ?? 12;

  let inner = null;

  switch (type) {
    // ── Text field ──────────────────────────────────────────────────────────
    case "simple-text-field":
      inner = (
        <TextField
          fullWidth size="small" label={label} disabled={disabled}
          value={values[name] ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          sx={tfSx}
        />
      );
      break;

    // ── Multi-text-field (chip input) ────────────────────────────────────────
    case "multi-text-field":
      inner = (
        <MultiTextField
          label={label}
          name={name}
          disabled={disabled}
          placeholder={comp.placeholder}
          values={values}
          onChange={onChange}
        />
      );
      break;

    // ── Textarea ────────────────────────────────────────────────────────────
    case "textarea":
      inner = (
        <TextField
          fullWidth multiline rows={rows ?? 3} label={label} disabled={disabled}
          value={values[name] ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          sx={tfSx}
        />
      );
      break;

    // ── Number ──────────────────────────────────────────────────────────────
    case "number":
      inner = (
        <TextField
          fullWidth size="small" type="number" label={label} disabled={disabled}
          inputProps={{ min, max, step: step ?? 1 }}
          value={values[name] ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          sx={tfSx}
        />
      );
      break;

    // ── Password ────────────────────────────────────────────────────────────
    case "password":
      inner = (
        <TextField
          fullWidth size="small" type="password" label={label} disabled={disabled}
          value={values[name] ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          sx={tfSx}
        />
      );
      break;

    // ── Select ──────────────────────────────────────────────────────────────
    case "select":
      inner = (
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel sx={{ "&.Mui-focused": { color: "#10b981" } }}>{label}</InputLabel>
          <Select
            label={label}
            value={values[name] ?? ""}
            onChange={(e) => onChange(name, e.target.value)}
            sx={{ "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#10b981" } }}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
      break;

    // ── Multi-select ────────────────────────────────────────────────────────
    case "multi-select": {
      const selected = values[name] ?? [];
      inner = (
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel sx={{ "&.Mui-focused": { color: "#10b981" } }}>{label}</InputLabel>
          <Select
            multiple
            label={label}
            value={selected}
            onChange={(e) => onChange(name, e.target.value)}
            input={<OutlinedInput label={label} />}
            renderValue={(sel) =>
              sel.map((v) => options.find((o) => o.value === v)?.label ?? v).join(", ")
            }
            sx={{ "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#10b981" } }}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox
                  checked={selected.includes(opt.value)}
                  sx={{ "&.Mui-checked": { color: "#10b981" }, p: 0.5 }}
                />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
      break;
    }

    // ── Autocomplete ────────────────────────────────────────────────────────
    case "autocomplete":
      inner = (
        <Autocomplete
          fullWidth
          options={options}
          getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.label)}
          isOptionEqualToValue={(opt, val) => opt.value === (val?.value ?? val)}
          value={options.find((o) => o.value === values[name]) ?? null}
          onChange={(_, newVal) => onChange(name, newVal?.value ?? null)}
          disabled={disabled}
          renderInput={(params) => (
            <TextField {...params} size="small" label={label} sx={tfSx} />
          )}
        />
      );
      break;

    // ── Checkbox ────────────────────────────────────────────────────────────
    case "checkbox":
      inner = (
        <FormControlLabel
          label={label}
          control={
            <Checkbox
              checked={!!values[name]}
              onChange={(e) => onChange(name, e.target.checked)}
              disabled={disabled}
              sx={{ "&.Mui-checked": { color: "#10b981" } }}
            />
          }
        />
      );
      break;

    // ── Radio ───────────────────────────────────────────────────────────────
    case "radio":
      inner = (
        <FormControl disabled={disabled}>
          <FormLabel sx={{ "&.Mui-focused": { color: "#10b981" }, fontSize: "0.85rem" }}>
            {label}
          </FormLabel>
          <RadioGroup
            value={values[name] ?? ""}
            onChange={(e) => onChange(name, e.target.value)}
            row
          >
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                label={opt.label}
                control={
                  <Radio size="small" sx={{ "&.Mui-checked": { color: "#10b981" } }} />
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      );
      break;

    // ── Switch ──────────────────────────────────────────────────────────────
    case "switch":
      inner = (
        <FormControlLabel
          label={label}
          control={
            <Switch
              checked={!!values[name]}
              onChange={(e) => onChange(name, e.target.checked)}
              disabled={disabled}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#10b981" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#10b981",
                },
              }}
            />
          }
        />
      );
      break;

    // ── Slider ──────────────────────────────────────────────────────────────
    case "slider":
      inner = (
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Slider
            value={values[name] ?? min ?? 0}
            onChange={(_, val) => onChange(name, val)}
            min={min ?? 0}
            max={max ?? 100}
            step={step ?? 1}
            disabled={disabled}
            valueLabelDisplay="auto"
            marks={[
              { value: min ?? 0, label: String(min ?? 0) },
              { value: max ?? 100, label: String(max ?? 100) },
            ]}
            sx={{
              color: "#10b981",
              "& .MuiSlider-thumb": { "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 8px #10b98130" } },
            }}
          />
        </Box>
      );
      break;

    // ── Rating ──────────────────────────────────────────────────────────────
    case "rating":
      inner = (
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Box>
            <Rating
              value={Number(values[name]) || 0}
              onChange={(_, val) => onChange(name, val)}
              max={max ?? 5}
              disabled={disabled}
              sx={{ color: "#10b981" }}
            />
          </Box>
        </Box>
      );
      break;

    // ── Toggle Button ───────────────────────────────────────────────────────
    case "toggle-button":
      inner = (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {label}
          </Typography>
          <ToggleButtonGroup
            value={values[name] ?? null}
            exclusive
            onChange={(_, val) => { if (val !== null) onChange(name, val); }}
            disabled={disabled}
            size="small"
            sx={{
              "& .MuiToggleButton-root.Mui-selected": {
                color: "#10b981",
                borderColor: "#10b981",
                bgcolor: "#10b98115",
              },
            }}
          >
            {options.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      );
      break;

    // ── Date ────────────────────────────────────────────────────────────────
    case "date":
      inner = (
        <TextField
          fullWidth size="small" type="date" label={label}
          disabled={disabled}
          InputLabelProps={{ shrink: true }}
          value={values[name] ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          sx={tfSx}
        />
      );
      break;

    // ── Time ────────────────────────────────────────────────────────────────
    case "time":
      inner = (
        <TextField
          fullWidth size="small" type="time" label={label}
          disabled={disabled}
          InputLabelProps={{ shrink: true }}
          value={values[name] ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          sx={tfSx}
        />
      );
      break;

    // ── Color picker ────────────────────────────────────────────────────────
    case "color":
      inner = (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {label}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="input"
              type="color"
              disabled={disabled}
              value={values[name] ?? "#10b981"}
              onChange={(e) => onChange(name, e.target.value)}
              sx={{
                width: 48,
                height: 36,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                cursor: "pointer",
                p: 0.25,
                bgcolor: "transparent",
              }}
            />
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {values[name] ?? "#10b981"}
            </Typography>
          </Box>
        </Box>
      );
      break;

    // ── File ────────────────────────────────────────────────────────────────
    case "file":
      inner = (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {label}
          </Typography>
          <Button
            component="label"
            variant="outlined"
            size="small"
            disabled={disabled}
            sx={{
              borderColor: "#10b98160",
              color: "#10b981",
              "&:hover": { borderColor: "#10b981", bgcolor: "#10b98110" },
            }}
          >
            {values[name] ? `📄 ${values[name]}` : "Seleccionar archivo"}
            <input
              type="file"
              accept={accept}
              hidden
              onChange={(e) => onChange(name, e.target.files?.[0]?.name ?? null)}
            />
          </Button>
          {accept && (
            <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
              {accept}
            </Typography>
          )}
        </Box>
      );
      break;

    // ── Unknown ──────────────────────────────────────────────────────────────
    default:
      inner = (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          Tipo no soportado: <strong>{type}</strong>
        </Alert>
      );
  }

  return (
    <Grid item xs={xsSize} md={mdSize}>
      {inner}
    </Grid>
  );
}

// ── Group renderer ────────────────────────────────────────────────────────────
function RenderGroup({ group, groupIndex }) {
  const components = group.components ?? [];
  const [values, setValues] = useState({});

  const handleChange = (name, value) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Chip
          label={`Grupo ${groupIndex + 1}`}
          size="small"
          sx={{ bgcolor: "#10b98120", color: "#10b981", fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          {components.length} componente{components.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {components.map((comp, i) => (
          <RenderComponent
            key={`${comp.name ?? i}-${i}`}
            comp={comp}
            values={values}
            onChange={handleChange}
          />
        ))}
      </Grid>

      {/* Live form state */}
      {Object.keys(values).length > 0 && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: "#1e1e1e",
            borderRadius: 1.5,
            fontFamily: "monospace",
            fontSize: "0.78rem",
            color: "#10b981",
            border: "1px solid #10b98130",
            whiteSpace: "pre-wrap",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#9ca3af", display: "block", mb: 0.5 }}
          >
            📤 Valores del formulario:
          </Typography>
          {JSON.stringify(values, null, 2)}
        </Box>
      )}
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function JsonBuilderForm() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON);

  const { parsed, parseError } = useMemo(() => {
    if (!jsonInput.trim()) return { parsed: null, parseError: null };
    try {
      const p = JSON.parse(jsonInput);
      if (!Array.isArray(p))
        return { parsed: null, parseError: "El JSON debe ser un arreglo [ ... ]." };
      return { parsed: p, parseError: null };
    } catch (e) {
      return { parsed: null, parseError: e.message };
    }
  }, [jsonInput]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <DataObjectIcon sx={{ color: "#10b981", fontSize: 28 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#10b981", lineHeight: 1.2 }}>
            JSON Form Builder
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {SUPPORTED_TYPES.length} tipos de componentes soportados
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* ── LEFT: JSON editor ── */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <CodeIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
            <Typography variant="subtitle2" color="text.secondary">
              Schema JSON
            </Typography>
          </Box>

          <TextField
            multiline
            rows={28}
            fullWidth
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            error={!!parseError}
            helperText={parseError ?? "✓ JSON válido"}
            FormHelperTextProps={{
              sx: { color: parseError ? "error.main" : "#10b981", mt: 0.5 },
            }}
            InputProps={{
              sx: {
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                fontSize: "0.78rem",
                bgcolor: "#1a1a2e",
                color: "#e2e8f0",
                alignItems: "flex-start",
                "& textarea": { lineHeight: 1.6 },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#2d3748" },
                "&:hover fieldset": { borderColor: "#10b98160" },
                "&.Mui-focused fieldset": { borderColor: "#10b981" },
              },
            }}
          />
        </Grid>

        {/* ── RIGHT: Live preview ── */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <VisibilityIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
            <Typography variant="subtitle2" color="text.secondary">
              Vista previa en vivo
            </Typography>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
              minHeight: 400,
              maxHeight: 700,
              overflowY: "auto",
              borderColor: "#2d3748",
              bgcolor: "background.paper",
              borderRadius: 2,
            }}
          >
            {parseError && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                  gap: 1,
                  color: "text.disabled",
                }}
              >
                <DataObjectIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                <Typography variant="body2" color="error">
                  JSON inválido
                </Typography>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ textAlign: "center", maxWidth: 260 }}
                >
                  {parseError}
                </Typography>
              </Box>
            )}

            {!parseError && !parsed && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                  color: "text.disabled",
                }}
              >
                <Typography variant="body2">
                  Escribí un JSON para ver la preview…
                </Typography>
              </Box>
            )}

            {!parseError && parsed && parsed.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                El arreglo está vacío.
              </Typography>
            )}

            {!parseError &&
              parsed &&
              parsed.map((group, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Divider sx={{ my: 3 }} />}
                  <RenderGroup group={group} groupIndex={i} />
                </React.Fragment>
              ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Types legend */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Tipos soportados ({SUPPORTED_TYPES.length}):
        </Typography>
        <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
          {SUPPORTED_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.68rem",
                borderColor: "#10b98150",
                color: "#10b981",
                height: 22,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default JsonBuilderForm;
