import { computed } from "vue";
import { useI18n } from "./i18n";

export const useCv = () => {
  const { locale } = useI18n();
  const cvUrl = computed(() => encodeURI(locale.value === "id"
    ? "/CV Harits Achmad Fauzan-Versi bahasa indonesia.pdf"
    : "/Harits_Achmad_Fauzan_Resume.pdf"));

  return { cvUrl, cvFilename: "CV_Harits_Achmad_Fauzan.pdf" };
};
