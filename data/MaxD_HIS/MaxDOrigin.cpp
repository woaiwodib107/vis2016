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
const double eps=1e-11;
template<class T> inline void checkmin(T &a,T b){if(b<a) a=b;}
template<class T> inline void checkmax(T &a,T b){if(b>a) a=b;}
template<class T> inline T sqr(T x){return x*x;}
typedef pair<int,int> ipair;
#define SIZE(A) ((int)A.size())
#define LENGTH(A) ((int)A.length())
#define MP(A,B) make_pair(A,B)
#define PB(X) push_back(X)
typedef vector<int> VI;

int n,m,c;
int *degree,**graph;
int *area;
int total_target;

void load_area(string filename)
{
    area=new int[n];
    FILE *f=fopen(filename.c_str(),"r");
    fscanf(f,"%d",&total_target);
    for (int i=0;i<n;i++) fscanf(f,"%d",&area[i]);
    fclose(f);
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

//int random()
//{
//    int v1=rand()&32767;
//    int v2=rand()&32767;
//    return (v1<<15)|v2;
//}
//
//int random(int n)
//{
//    return random()%n;
//}

VI get_community_kernel(int mask)
{
    VI ret;
    vector<pair<int, int> > q;
    for (int i = 0; i < n; ++i)
        if ((area[i] & mask) == mask)
            q.push_back(MP(degree[i], i));
    sort(q.begin(), q.end());
    reverse(q.begin(), q.end());
    for (int i = 0; i < SIZE(q) / 5; ++i)
        ret.push_back(q[i].second);
    return ret;
}

const int maxnode=7000000+5;
const int maxedge=60000000+5;
const int oo=1000000000;

int node,src,dest,nedge;
int head[maxnode],point[maxedge],next_[maxedge],flow[maxedge],capa[maxedge];
int dist[maxnode],Q[maxnode],work[maxnode];
bool dsave[maxnode];
int prev_flow[maxedge];

void init(int _node,int _src,int _dest)
{
    node=_node;
    src=_src;
    dest=_dest;
    for (int i=0;i<node;i++) head[i]=-1;
    nedge=0;
}
void addedge(int u,int v,int c1,int c2)
{
    point[nedge]=v,capa[nedge]=c1,flow[nedge]=0,next_[nedge]=head[u],head[u]=(nedge++);
    point[nedge]=u,capa[nedge]=c2,flow[nedge]=0,next_[nedge]=head[v],head[v]=(nedge++);
}
bool dinic_bfs()
{
    for (int i=0;i<node;i++) dist[i]=-1;
    dist[src]=0;
    int sizeQ=0;
    Q[sizeQ++]=src;
    for (int cl=0;cl<sizeQ;cl++)
        for (int k=Q[cl],i=head[k];i>=0;i=next_[i])
            if (flow[i]<capa[i] && dsave[point[i]] && dist[point[i]]<0)
            {
                dist[point[i]]=dist[k]+1;
                Q[sizeQ++]=point[i];
            }
    return dist[dest]>=0;
}
int dinic_dfs(int x,int exp)
{
    if (x==dest) return exp;
    int res=0;
    for (int &i=work[x];i>=0;i=next_[i])
    {
        int v=point[i],tmp;
        if (flow[i]<capa[i] && dist[v]==dist[x]+1 && (tmp=dinic_dfs(v,min(exp,capa[i]-flow[i])))>0)
        {
            flow[i]+=tmp;
            flow[i^1]-=tmp;
            res+=tmp;
            exp-=tmp;
            if (exp==0) break;
        }
    }
    return res;
}
int dinic_flow()
{
    int result=0;
    while (dinic_bfs())
    {
        for (int i=0;i<node;i++) work[i]=head[i];
        result+=dinic_dfs(src,oo);
    }
    return result;
}

void load_community_kernels(string filename,vector<VI> &kernels)
{
    FILE *f=fopen(filename.c_str(),"r");
    int size;
    while (fscanf(f,"%d",&size)!=-1)
    {
        VI a;
        int t;
        for (int i=0;i<size;i++) { fscanf(f,"%d",&t); a.push_back(t); }
        kernels.push_back(a);
    }
    fclose(f);
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

void build_network(vector<VI> kernels)
{
    //printf("DEBUG : build_network : ");
    init(n*(c-1)+2,n*(c-1),n*(c-1)+1);
    for (int base=0,k=0;k<c;k++)
    {
        set<int> S1,S2;
        for (int i=0;i<c;i++) for (int j=0;j<SIZE(kernels[i]);j++)
            if (i==k) S1.insert(kernels[i][j]);
            else if (i<k) S2.insert(kernels[i][j]);
        if (SIZE(S1)==0 || SIZE(S2)==0) continue;
        for (int i=0;i<n;i++) for (int j=0;j<degree[i];j++) addedge(base+i,base+graph[i][j],1,1);
        for (set<int>::iterator it=S1.begin();it!=S1.end();++it) if (S2.find(*it)==S2.end()) addedge(src,base+(*it),n,0);
        for (set<int>::iterator it=S2.begin();it!=S2.end();++it) if (S1.find(*it)==S1.end()) addedge(base+(*it),dest,n,0);
        base+=n;
    }
    //printf("node = %d   edge = %d\n",node,nedge);
}

int max_flow(vector<VI> &kernels,bool *save,int *prev_flow=NULL)
{
    for (int i=0;i<node;i++) dsave[i]=true;
    if (prev_flow!=NULL) for (int i=0;i<nedge;i++) flow[i]=prev_flow[i];
    else for (int i=0;i<nedge;i++) flow[i]=0;
    for (int i=0;i<n;i++) for (int k=0;k<c-1;k++) dsave[k*n+i]=save[i];
    int ret=dinic_flow();
    return ret;
}

int get_multi_cut(vector<VI> &kernels,bool *save)
{
    build_network(kernels);
    int ret=max_flow(kernels,save);
    return ret;
}

ipair pick_candidate(VI &candidates,vector<VI> &kernels,bool *save)
{
    for (int i=0;i<SIZE(candidates);i++) save[candidates[i]]=false;
    int old_flow=max_flow(kernels,save);
    for (int i=0;i<nedge;i++) prev_flow[i]=flow[i];
    int mcut=100000000,best_key=-1;
    //printf("%d",SIZE(candidates));
    for (int i=0;i<SIZE(candidates);i++)
    {
        int key=candidates[i];
        for (int j=0;j<SIZE(candidates);j++) save[candidates[j]]=true;
        save[key]=false;
        //printf(" %d",i);
        int tmp=max_flow(kernels,save,prev_flow);
        if (tmp<mcut) mcut=tmp,best_key=key;
    }
    //printf("\n");
    for (int i=0;i<SIZE(candidates);i++) save[candidates[i]]=true;
    save[best_key]=false;
    return MP(old_flow+mcut,best_key);
}

int main(int argc,char **args)
{
    string graph_file="/Users/jason/Desktop/200-2016/outputLink2016";
    string community_file="/Users/jason/Desktop/200-2016/community2016";
    vector<int> areaMain;
    int size=50;
    for (int i=1;i+1<argc;i++) if (args[i][0]=='-')
        if (args[i][1]=='g')
            graph_file=args[i+1];
        else if (args[i][1]=='c')
            community_file=args[i+1];
        else if (args[i][1]=='a')
            areaMain.push_back(atoi(args[i+1]));
        else if (args[i][1]=='k')
            size=atoi(args[i+1]);
    load_graph(graph_file);
    load_area(community_file);
    vector<VI> kernels;
    
    for(int i = 0; i < total_target; i++)
    {
        areaMain.push_back(two(i));
    }

    for (int i=0;i<SIZE(areaMain);i++) kernels.push_back(get_community_kernel(areaMain[i]));
    if (SIZE(kernels)<2)
    {
        printf("ERROR : we should have at least 2 communities.");
        return 0;
    }
    for (int i=0;i<SIZE(kernels);i++) if (SIZE(kernels[i])==0)
    {
        printf("Community %d is too small.",i);
        return 0;
    }
    cout<<"ready to compute.."<<endl;
    c=SIZE(kernels);
    bool *save=new bool[n];
    for (int i=0;i<n;i++) save[i]=true;
    build_network(kernels);
    int *sflow=new int[n];
    ipair *q=new ipair[n];
    for (int step=0;step<size;step++)
    {
        for (int i=0;i<n;i++) sflow[i]=0;
        max_flow(kernels,save);
        for (int i=0;i<n*(c-1);i++) for (int k=head[i];k>=0;k=next_[k]) if (flow[k]>0) sflow[i%n]+=flow[k];
        for (int i=0;i<n;i++) 
            if (!save[i])
                q[i]=MP(-1,i);
            else
                q[i]=MP(sflow[i]+degree[i],i);
        sort(q,q+n);
        reverse(q,q+n);
        vector<int> candidates;
        for (int i=0;i<n;i++) if (save[q[i].second] && SIZE(candidates)<size) candidates.push_back(q[i].second);
        ipair ret=pick_candidate(candidates,kernels,save);
        //printf("STEP %2d %d\n",step,ret.first);
        //printf("%d\n",ret.second);
        printf("node: %d \tscore: %d\n",ret.second,ret.first);
    }
    delete[] sflow;
    delete[] q;
    return 0;
}
/*
 ready to compute..
 node: 74 	score: 366
 node: 264 	score: 316
 node: 48 	score: 280
 node: 95 	score: 246
 node: 332 	score: 220
 node: 676 	score: 194
 node: 377 	score: 172
 node: 670 	score: 152
 node: 631 	score: 134
 node: 453 	score: 116
 node: 685 	score: 100
 node: 639 	score: 84
 node: 3 	score: 72
 node: 46 	score: 60
 node: 333 	score: 50
 node: 67 	score: 40
 node: 601 	score: 30
 node: 210 	score: 22
 node: 515 	score: 16
 node: 444 	score: 10
 node: 411 	score: 6
 node: 285 	score: 2
 node: 416 	score: 0
 node: 539 	score: 0
 node: 671 	score: 0
 node: 490 	score: 0
 node: 537 	score: 0
 node: 654 	score: 0
 node: 519 	score: 0
 node: 646 	score: 0
 node: 161 	score: 0
 node: 61 	score: 0
 node: 607 	score: 0
 node: 220 	score: 0
 node: 107 	score: 0
 node: 225 	score: 0
 node: 115 	score: 0
 node: 6 	score: 0
 node: 632 	score: 0
 node: 492 	score: 0
 node: 399 	score: 0
 node: 295 	score: 0
 node: 131 	score: 0
 node: 633 	score: 0
 node: 415 	score: 0
 node: 114 	score: 0
 node: 33 	score: 0
 node: 17 	score: 0
 node: 566 	score: 0
 node: 547 	score: 0
 Program ended with exit code: 0
 */

