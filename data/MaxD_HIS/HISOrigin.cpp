#include <vector>
#include <list>
#include <map>
#include <set>
#include <deque>
#include <queue>
#include <stack>
#include <bitset>
#include <algorithm>
#include <functional>
#include <numeric>
#include <utility>
#include <sstream>
#include <iostream>
#include <iomanip>
#include <cstdio>
#include <cmath>
#include <cstdlib>
#include <cctype>
#include <string>
#include <cstring>
#include <ctime>
#include <string.h>

using namespace std;

typedef long long int64;
typedef unsigned long long uint64;
#define two(X) (1<<(X))
#define twoL(X) (((int64)(1))<<(X))
#define contain(S,X) (((S)&two(X))!=0)
#define containL(S,X) (((S)&twoL(X))!=0)
const double pi=acos(-1.0);
const double eps=1e-13;
template<class T> inline void checkmin(T &a,T b){if(b<a) a=b;}
template<class T> inline void checkmax(T &a,T b){if(b>a) a=b;}
template<class T> inline T sqr(T x){return x*x;}
typedef pair<int,int> ipair;
#define SIZE(A) ((int)A.size())
#define LENGTH(A) ((int)A.length())
#define MP(A,B) make_pair(A,B)
#define PB(X) push_back(X)
typedef vector<int> VI;
int countbit(int n) { return (n==0)?0:(1+countbit(n&(n-1)));}

int n,m,*area;
int *degree,**graph;
VI res;

double **sh;
double **influential;
int total_target;
pair<double,int> *q;

int random(int n)
{
    int v1=rand()&32767;
    int v2=rand()&32767;
    return ((v1<<15)|v2)%n;
}

void get_page_rank(double *page_rank)
{
    int cnt=0;
    for (int i=0;i<n;i++) page_rank[i]=0;
    for (int i=0;i<n;i++) if (degree[i]>0) { cnt++; page_rank[i]=1; }
    double ratio=0.85;
    double *s=new double[n];
    for (int step=0;step<100;step++)
    {
        for (int i=0;i<n;i++) if (degree[i]>0)
        {
            s[i]=(double)(1.0-ratio)/cnt;
            for (int j=0;j<degree[i];j++) s[i]+=ratio*page_rank[graph[i][j]]/degree[graph[i][j]];
        }
        for (int i=0;i<n;i++) if (degree[i]>0) page_rank[i]=s[i];
        double maxp=0;
        for (int i=0;i<n;i++) if (page_rank[i]>maxp) maxp=page_rank[i];
        if (maxp<1e-10) break;
        for (int i=0;i<n;i++) page_rank[i]/=maxp;
    }
    delete[] s;
}

void load_graph(string filename)
{
    FILE *f=fopen(filename.c_str(),"r");
    fscanf(f,"%d%d",&n,&m);
    int *e_list=new int[m+m];
    for (int i=0;i<m+m;i++) fscanf(f,"%d",&e_list[i]);
    degree=new int[n];
    for (int i=0;i<n;i++) degree[i]=0;
    for (int i=0;i<m+m;i++) if (e_list[i]!=e_list[i^1]) degree[e_list[i]]++;
    graph=new int* [n];
    for (int i=0;i<n;i++) graph[i]=new int[degree[i]];
    for (int i=0;i<n;i++) degree[i]=0;
    for (int i=0;i<m+m;i++) if (e_list[i]!=e_list[i^1]) graph[e_list[i]][degree[e_list[i]]++]=e_list[i^1];
    delete[] e_list;
    fclose(f);
}

/*VI*/void structure_hole_min_max_faster(int c,int size,double *alpha,double *beta,double *page_rank,vector<int> target_communities)
{
    influential=new double* [n];
    sh=new double* [n];
    for (int i=0;i<n;i++)
        influential[i]=new double[c];
    for (int i=0;i<n;i++)
        sh[i]=new double[two(c)];
    for (int i=0;i<n;i++)
        for (int j=0;j<c;j++)
            influential[i][j]=0.0;
    for (int i=0;i<n;i++)
        for (int j=0;j<two(c);j++)
            sh[i][j]=0.0;
    
    int heapsize=0;
    int *heap=new int[n];
    int *pos=new int[n];
    double *tp=new double[n];
    for (int i=0;i<n;i++) pos[i]=-1;
    for (int i=0;i<n;i++) tp[i]=0;
    for (int k=0;k<c;k++) for (int i=0;i<n;i++) if ((area[i]&target_communities[k])==target_communities[k])
    {
        influential[i][k]=page_rank[i];
        if (influential[i][k]>tp[i]+eps)
        {
            tp[i]=influential[i][k];
            pos[i]=heapsize-1;
            heap[heapsize++]=i;
            for (int i=heapsize-1,j=(i-1)>>1;i>0;i=j,j=(i-1)>>1)
                if (tp[heap[i]]>tp[heap[j]])
                    swap(heap[i],heap[j]);
                else
                    break;
        }
    }
    double *exp_inf=new double[c];
    while (heapsize>0)
    {
        int idx=heap[0];
        tp[idx]=0;
        pos[idx]=-1;
        heap[0]=heap[--heapsize];
        if (heapsize>0)
        {
            int i=0,key=heap[0];
            double tmp=tp[key];
            for (int j=(i<<1)+1;j<heapsize;i=j,j=(i<<1)+1)
            {
                if (j+1<heapsize && tp[heap[j+1]]>tp[heap[j]]) j++;
                if (tp[heap[j]]<=tmp) break;
                heap[i]=heap[j];
                pos[heap[i]]=i;
            }
            heap[i]=key;pos[key]=i;
        }
        double *gset=sh[idx],*gs=influential[idx];
        gset[0]=1e100;
        for (int k=0,set=1;set<two(c);set++)
        {
            if (!contain(set,k)) k++;
            gset[set]=min(gs[k],gset[set^two(k)]);
        }
        for (int i=0;i<c;i++) exp_inf[i]=0;
        for (int set=0;set<two(c);set++)
        {
            double tmp=beta[set]*gset[set];
            if (tmp<eps) continue;
            for (int i=0;i<c;i++) if (contain(set,i)) checkmax(exp_inf[i],tmp);
        }
        for (int e_id=0;e_id<degree[idx];e_id++)
        {
            int other=graph[idx][e_id];
            for (int i=0;i<c;i++)
            {
                double new_inf=alpha[i]*gs[i]+exp_inf[i];
                if (new_inf>influential[other][i]+eps)
                {
                    influential[other][i]=new_inf;
                    if (new_inf<=tp[other]+eps) continue;
                    tp[other]=new_inf;
                    if (pos[other]<0)
                    {
                        pos[other]=heapsize;
                        heap[heapsize++]=other;
                    }
                    int i=pos[other];
                    for (int j=(i-1)>>1;i>0;i=j,j=(i-1)>>1)
                    {
                        if (tp[heap[j]]>=new_inf) break;
                        heap[i]=heap[j];
                        pos[heap[i]]=i;
                    }
                    heap[i]=other;
                    pos[other]=i;
                }
            }
        }
    }
    delete[] exp_inf;
    
    int qsize=0;
    q=new pair<double,int> [n];
    for (int i=0;i<n;i++)
    {
        double s2=0;
        for (int k=0;k<two(c);k++) checkmax(s2,beta[k]*sh[i][k]);
        double s3=0;
        for (int j=0;j<c;j++) s3+=influential[i][j];
        double weight=(int)(s2*1e5)+(int)(s3*1e5/c)/1e5+degree[i]/1e9;
        q[qsize++]=MP(-weight,i);
    }
    sort(q,q+qsize);
    VI ret;
    for (int i=0;i<size && i<qsize;i++) ret.push_back(q[i].second);
    
    delete[] tp;
    delete[] heap;
    delete[] pos;
//    for (int i=0;i<n;i++) {
//        //delete[] sh[i];
//        //delete[] influential[i];
//    }
    //delete[] sh;
    //delete[] influential;
    //return ret;
}

VI get_common(VI a,VI b)
{
    VI c;
    sort(a.begin(),a.end());
    sort(b.begin(),b.end());
    for (int i=0,j=0;i<SIZE(a) && j<SIZE(b);)
        if (a[i]==b[j])
        {
            c.push_back(a[i]);
            i++;
            j++;
        }
        else if (a[i]<b[j])
            i++;
        else
            j++;
    return c;
}

void load_area(string filename)
{
    area=new int[n];
    FILE *f=fopen(filename.c_str(),"r");
    fscanf(f,"%d",&total_target);
    for (int i=0;i<n;i++) fscanf(f,"%d",&area[i]);
    fclose(f);
}

int main(int argc,char **args)
{
    string graph_file="/Users/jason/Desktop/200-2016/outputLink2002";
    string community_file="/Users/jason/Desktop/200-2016/community2002";

    
    vector<int> target_communities;
    int size=50;
    for (int i=1;i+1<argc;i++) if (args[i][0]=='-')
        if (args[i][1]=='g')
            graph_file=args[i+1];
        else if (args[i][1]=='c')
            community_file=args[i+1];
        else if (args[i][1]=='a')
            target_communities.push_back(atoi(args[i+1]));
        else if (args[i][1]=='k')
            size=atoi(args[i+1]);
    load_graph(graph_file);
    load_area(community_file);
    double *page_rank=new double[n];
    get_page_rank(page_rank);
    
//    for(int i = 0; i < n; i++)
//    {
//        if(area[i] != 0)
//        {
//            int j = 0;
//            for( ; j < target_communities.size(); j++)
//            {
//                if(target_communities[j] == area[i])
//                    break;
//            }
//            if(j == target_communities.size())
//                target_communities.push_back(area[i]);
//            
//        }
//    }
    for(int i = 0; i < total_target; i++)
    {
        target_communities.push_back(two(i));
    }
    if (SIZE(target_communities)<2)
    {
        printf("ERROR : we should have at least 2 communities.");
        return 0;
    }
    int c=SIZE(target_communities);
    double *alpha=new double[c];
    double *beta=new double[two(c)];
    for (int i=0;i<c;i++) alpha[i]=0.3;
    for (int set=0;set<two(c);set++) 
        if (countbit(set)==0) beta[set]=0;
        else if (countbit(set)==1) beta[set]=0;
        else if (countbit(set)==2) beta[set]=0.17;
        else if (countbit(set)==3) beta[set]=0.25;
        else if (countbit(set)==4) beta[set]=0.29;
        else if (countbit(set)==5) beta[set]=0.30;
        else if (countbit(set)>=6) beta[set]=0.35;
    cout<<"step into computation.."<<endl;
    int finalIndex = 0;
    for(int i = 0; i < total_target; i++)
        finalIndex += two(i);
    cout<<"final index: "<<finalIndex<<endl;
    //VI r2=structure_hole_min_max_faster(c,size,alpha,beta,page_rank,target_communities);
    structure_hole_min_max_faster(c,size,alpha,beta,page_rank,target_communities);
    for (int i=0;i<50;i++)
        //printf("%d\n",r2[i]);
        printf("v:%d \tscore = %lf \n", q[i].second, -q[i].first);
    
    delete[] alpha;
    delete[] beta;
    
    return 0;
}
/*
 results:

 step into computation..
 820
 102
 513
 417
 498
 943
 292
 899
 1305
 18
 180
 1275
 125
 1335
 600
 47
 761
 62
 481
 1208
 8
 1026
 677
 295
 664
 388
 175
 1333
 192
 32
 565
 391
 37
 1126
 51
 463
 530
 1092
 1332
 851
 1105
 331
 1140
 321
 153
 803
 183
 952
 733
 905
 Program ended with exit code: 0
 
 */

