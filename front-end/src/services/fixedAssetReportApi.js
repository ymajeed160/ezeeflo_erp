import axiosInstance from './axiosInstance';

const fixedAssetReportApi = {
  execute(reportName, params = {}) {
    return axiosInstance.post(`/fixed-asset-reports/${reportName}`, params).then((r) => r.data);
  },
};

export default fixedAssetReportApi;
